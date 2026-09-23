import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// The "ungrounded" side of the showdown: the same model, no knowledge base, no
// conflict check. Just what it believes. Honest control for the grounded agent.
const BASE = (process.env.LLM_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '')
const MODEL = process.env.LLM_MODEL || 'MiniMax-M3'

const system =
  'You are a helpful Next.js expert. Answer the developer question directly and concisely in 2 to 4 sentences from your own knowledge. Do not mention sources or say you are unsure.'

// Best-effort in-process guard for a paid endpoint. Serverless instances are
// ephemeral and not shared, so this bounds abuse per instance, not globally. It
// is a cheap first line, not a substitute for an edge WAF or gateway limits.
const RATE = {capacity: 20, windowMs: 60_000}
const buckets = new Map<string, {tokens: number; last: number}>()

function clientIp(req: NextRequest): string {
  // request.ip and request.geo were removed in Next 15, so derive it from headers.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const refill = RATE.capacity / RATE.windowMs
  const b = buckets.get(ip) || {tokens: RATE.capacity, last: now}
  b.tokens = Math.min(RATE.capacity, b.tokens + (now - b.last) * refill)
  b.last = now
  buckets.set(ip, b)
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now - v.last > RATE.windowMs) buckets.delete(k)
    }
  }
  if (b.tokens < 1) return true
  b.tokens -= 1
  return false
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // non-browser client or same-origin navigation, cannot tell so allow
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) {
      return NextResponse.json({error: 'cross-origin request blocked'}, {status: 403})
    }
    if (rateLimited(clientIp(req))) {
      return NextResponse.json(
        {error: 'rate limit exceeded'},
        {status: 429, headers: {'Retry-After': '3'}},
      )
    }
    const {question} = await req.json()
    const key = process.env.LLM_API_KEY
    if (!key) return NextResponse.json({error: 'LLM_API_KEY is required'}, {status: 500})
    if (!question || typeof question !== 'string') {
      return NextResponse.json({error: 'question is required'}, {status: 400})
    }
    let lastErr: Error | null = null
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          messages: [
            {role: 'system', content: system},
            {role: 'user', content: question.slice(0, 500)},
          ],
        }),
      })
      if (res.ok) {
        const j = await res.json()
        const answer = String(j?.choices?.[0]?.message?.content || '')
          .replace(/<think>[\s\S]*?<\/think>/gi, '')
          .trim()
        return NextResponse.json({answer: answer || '(no answer)'})
      }
      const body = await res.text()
      lastErr = new Error(`LLM ${res.status}: ${body.slice(0, 160)}`)
      if (res.status !== 429 && res.status < 500) break
      await new Promise((r) => setTimeout(r, 700 * (i + 1)))
    }
    return NextResponse.json({error: lastErr?.message || 'model error'}, {status: 502})
  } catch (err: unknown) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'error'}, {status: 500})
  }
}
