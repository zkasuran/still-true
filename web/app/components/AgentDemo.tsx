'use client'

import {useEffect, useRef, useState} from 'react'

const SUGGESTIONS = [
  'Does Next.js cache fetch by default?',
  'App Router or Pages Router?',
  'Are route params async now?',
  'Where do I import fonts from?',
]

type Answer = {answer: string; readPaths: string[]; checkedConflicts: boolean}

const SAMPLE: {q: string; a: Answer} = {
  q: 'Does Next.js cache fetch by default?',
  a: {
    answer:
      'In the Next.js App Router, fetch is not cached by default. The sources disagree: the official docs say it is not cached, so you opt in with cache: "force-cache", while a popular tutorial says it is cached by default and you opt out with no-store. The official source wins, so treat fetch as uncached unless you deliberately opt in.',
    readPaths: ['fetch_caching'],
    checkedConflicts: true,
  },
}

export default function AgentDemo({autofocus = false}: {autofocus?: boolean}) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Answer | null>(SAMPLE.a)
  const [isSample, setIsSample] = useState(true)
  const [shown, setShown] = useState(SAMPLE.a.answer)
  const [speaking, setSpeaking] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autofocus) taRef.current?.focus()
  }, [autofocus])

  // word-by-word reveal when a new live answer arrives
  useEffect(() => {
    if (!result || isSample) return
    const words = result.answer.split(' ')
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(words.slice(0, i).join(' '))
      if (i >= words.length) clearInterval(id)
    }, 18)
    return () => clearInterval(id)
  }, [result, isSample])

  async function run(question: string) {
    setLoading(true)
    setError('')
    setResult(null)
    setShown('')
    setIsSample(false)
    setQ(question)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({question}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'request failed')
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'request failed')
    } finally {
      setLoading(false)
    }
  }

  async function speak(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
      })
      if (!res.ok) throw new Error('speak failed')
      const audio = new Audio(URL.createObjectURL(await res.blob()))
      audio.onended = () => setSpeaking(false)
      audio.onerror = () => setSpeaking(false)
      await audio.play()
    } catch {
      setSpeaking(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-zinc-500">still-true · grounded agent</span>
      </div>

      <div className="p-5">
        <div className="min-h-[9rem]">
          {loading ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" />
                </span>
                reading the knowledge base, checking for conflicts…
              </div>
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-white/[0.06]" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300">
              {error}
            </div>
          ) : result ? (
            <div>
              {isSample ? (
                <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-600">
                  sample answer · ask your own below
                </div>
              ) : (
                <div className="mb-2 truncate text-[13px] text-zinc-500">{q}</div>
              )}
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
                {isSample ? result.answer : shown}
                {!isSample && shown.length < result.answer.length ? (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-emerald-400 align-middle" />
                ) : null}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => speak(result.answer)}
                  disabled={speaking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-zinc-300 transition-colors hover:border-white/[0.2] hover:text-white disabled:opacity-50"
                >
                  <span aria-hidden>{speaking ? '♪' : '▶'}</span>
                  {speaking ? 'Playing…' : 'Listen'}
                </button>
                {result.checkedConflicts ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300 ring-1 ring-inset ring-amber-500/25">
                    checked for conflicts
                  </span>
                ) : null}
                {result.readPaths.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-zinc-400 ring-1 ring-inset ring-white/[0.06]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim() && !loading) run(q.trim())
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-white/[0.1] bg-black/20 p-2 focus-within:border-emerald-400/40">
            <textarea
              ref={taRef}
              value={isSample ? '' : q}
              onChange={(e) => {
                setIsSample(false)
                setQ(e.target.value)
              }}
              onFocus={() => setIsSample(false)}
              rows={1}
              placeholder="Ask about Next.js…"
              className="max-h-32 min-h-[2.25rem] w-full resize-none bg-transparent px-2 py-1.5 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || (!q.trim() && !isSample)}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? '…' : 'Ask'}
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              disabled={loading}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-400/30 hover:text-zinc-200 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
