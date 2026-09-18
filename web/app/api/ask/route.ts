import {NextRequest, NextResponse} from 'next/server'
import {ask} from '@/lib/agent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const {question} = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({error: 'question is required'}, {status: 400})
    }
    const result = await ask(question.slice(0, 500))
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({error: err?.message || 'agent error'}, {status: 500})
  }
}
