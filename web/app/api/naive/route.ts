import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// The "ungrounded" side of the showdown: the same model, no knowledge base, no
// conflict check. Just what it believes. Honest control for the grounded agent.
const BASE = (process.env.LLM_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '')
const MODEL = process.env.LLM_MODEL || 'MiniMax-M3'

const system =
  'You are a helpful Next.js expert. Answer the developer question directly and concisely in 2 to 4 sentences from your own knowledge. Do not mention sources or say you are unsure.'

export async function POST(req: NextRequest) {
  try {
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
