import {NextRequest, NextResponse} from 'next/server'
import {ask} from '@/lib/agent'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    if (!question || typeof question !== 'string') {
      return NextResponse.json({error: 'question is required'}, {status: 400})
    }
    const result = await ask(question.slice(0, 500))
    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json(
      {error: err instanceof Error ? err.message : 'agent error'},
      {status: 500},
    )
  }
}
