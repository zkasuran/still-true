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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <nav className="mb-10 flex gap-6 text-sm text-zinc-400">
        <a href="/" className="hover:text-white">
          Board
        </a>
        <span className="text-white">Ask</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-white">Ask the grounded agent</h1>
      <p className="mt-3 max-w-prose text-zinc-400">
        This agent answers only from the Sanity Context Knowledge Base. It reads the distilled entries,
        checks for conflicts, and when two sources disagree it shows both instead of guessing. A plain
        keyword search would hand you whichever version it found first.
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) run(q.trim())
        }}
      >
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          placeholder="Ask about the Claude API…"
          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-100 outline-none focus:border-white/25"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-40"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
          <span className="text-xs text-zinc-500">Grounded in a Sanity Knowledge Base, never memory.</span>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => run(s)}
            disabled={loading}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:border-white/25 hover:text-zinc-200 disabled:opacity-40"
          >
            {s.length > 48 ? s.slice(0, 46) + '…' : s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-8 space-y-4">
          <div className="whitespace-pre-wrap rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-zinc-100">
            {result.answer}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {result.checkedConflicts ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300 ring-1 ring-inset ring-amber-500/30">
                checked for conflicts
              </span>
            ) : null}
            {result.readPaths.map((p) => (
              <span key={p} className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-zinc-400">
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  )
}
