import {NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// Text to speech via MiniMax (same key as the agent model). Reads an answer aloud.
const BASE = (process.env.LLM_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  try {
    const {text} = await req.json()
    const key = process.env.LLM_API_KEY
    if (!key) return NextResponse.json({error: 'LLM_API_KEY is required'}, {status: 500})
    if (!text || typeof text !== 'string') {
      return NextResponse.json({error: 'text is required'}, {status: 400})
    }
    const res = await fetch(`${BASE}/t2a_v2`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'speech-02-hd',
        text: text.slice(0, 3000),
        stream: false,
        voice_setting: {voice_id: 'English_Trustworth_Man', speed: 1.05, vol: 1, pitch: 0},
        audio_setting: {format: 'mp3', sample_rate: 32000},
      }),
    })
    const data = await res.json()
    const hex: string | undefined = data?.data?.audio
    if (!hex) {
      return NextResponse.json(
        {error: data?.base_resp?.status_msg || 'text to speech failed'},
        {status: 502},
      )
    }
    const buf = Buffer.from(hex, 'hex')
    return new NextResponse(buf, {
      headers: {'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store'},
    })
  } catch (err: unknown) {
    return NextResponse.json(
      {error: err instanceof Error ? err.message : 'speak error'},
      {status: 500},
    )
  }
}
