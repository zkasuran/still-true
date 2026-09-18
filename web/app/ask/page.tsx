'use client'

import {useState} from 'react'

const SUGGESTIONS = [
  'How do I turn on extended thinking for Claude Opus 5, and is budget_tokens still the way?',
  'What should I set max_tokens to by default? Do the sources agree?',
  'What is the current web search tool type?',
  'Can I prefill the assistant message on Claude Opus 5?',
]

type Answer = {answer: string; readPaths: string[]; checkedConflicts: boolean}

export default function AskPage() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Answer | null>(null)

  async function run(question: string) {
    setLoading(true)
    setError('')
    setResult(null)
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

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-14">
      <section className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Grounded in a Knowledge Base, never memory
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Ask the grounded agent
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          This agent answers only from the Sanity Context Knowledge Base. It reads the distilled entries,
          checks for conflicts, and when two sources disagree it shows both instead of guessing. A plain
          keyword search would hand you whichever version it found first.
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) run(q.trim())
        }}
      >
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-2 focus-within:border-white/[0.2]">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={3}
            placeholder="Ask about the Claude API…"
            className="w-full resize-none bg-transparent px-3 py-2 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-zinc-600">Reads the graph, cites its sources.</span>
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {loading ? 'Thinking…' : 'Ask'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => run(s)}
            disabled={loading}
            className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/[0.18] hover:text-zinc-200 disabled:opacity-40"
          >
            {s.length > 46 ? s.slice(0, 44) + '…' : s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading && !result ? (
        <div className="mt-8 space-y-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : null}

      {result ? (
        <div className="mt-8 space-y-4">
          <div className="whitespace-pre-wrap rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-[15px] leading-relaxed text-zinc-100">
            {result.answer}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {result.checkedConflicts ? (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300 ring-1 ring-inset ring-amber-500/25">
                checked for conflicts
              </span>
            ) : null}
            {result.readPaths.length ? (
              <span className="text-zinc-600">grounded in</span>
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
    </main>
  )
}
