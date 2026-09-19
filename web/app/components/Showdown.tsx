'use client'

import {useState} from 'react'

const SUGGESTIONS = [
  'Does Next.js cache fetch by default?',
  'How do I read route params in a page?',
  'Where do I import fonts from?',
  'App Router or Pages Router for a new app?',
]

type Grounded = {answer: string; readPaths: string[]; checkedConflicts: boolean}

export default function Showdown() {
  const [q, setQ] = useState(SUGGESTIONS[0])
  const [ran, setRan] = useState(false)
  const [loadingN, setLoadingN] = useState(false)
  const [loadingG, setLoadingG] = useState(false)
  const [naive, setNaive] = useState<string | null>(null)
  const [grounded, setGrounded] = useState<Grounded | null>(null)
  const [speaking, setSpeaking] = useState(false)

  async function run(question: string) {
    if (!question.trim()) return
    setRan(true)
    setQ(question)
    setNaive(null)
    setGrounded(null)
    setLoadingN(true)
    setLoadingG(true)

    fetch('/api/naive', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question}),
    })
      .then((r) => r.json())
      .then((d) => setNaive(d.answer || d.error || 'no answer'))
      .catch(() => setNaive('the model call failed'))
      .finally(() => setLoadingN(false))

    fetch('/api/ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({question}),
    })
      .then((r) => r.json())
      .then((d) => setGrounded(d.error ? {answer: d.error, readPaths: [], checkedConflicts: false} : d))
      .catch(() => setGrounded({answer: 'the agent call failed', readPaths: [], checkedConflicts: false}))
      .finally(() => setLoadingG(false))
  }

  async function speak(text: string) {
    setSpeaking(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
      })
      if (!res.ok) throw new Error()
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
      <form
        className="border-b border-white/[0.07] p-4"
        onSubmit={(e) => {
          e.preventDefault()
          run(q)
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-white/[0.1] bg-black/20 p-2 focus-within:border-emerald-400/40">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a Next.js question…"
            className="w-full bg-transparent px-2 py-1.5 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loadingN || loadingG}
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loadingN || loadingG ? 'Running…' : ran ? 'Run again' : 'Run the showdown'}
          </button>
        </div>
        {!ran ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(s)}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-400/30 hover:text-zinc-200"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <div className="grid grid-cols-1 divide-y divide-white/[0.07] md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Ungrounded */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Plain model
            </span>
            <span className="text-xs text-zinc-600">no sources</span>
          </div>
          {!ran ? (
            <p className="text-sm leading-relaxed text-zinc-600">
              What the model says on its own, from training data. Confident, uncited, and it does not
              know when it is out of date.
            </p>
          ) : loadingN ? (
            <Skeleton />
          ) : (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-400">{naive}</p>
          )}
          {ran && !loadingN ? (
            <div className="mt-4 text-xs text-zinc-600">no sources · no conflict check</div>
          ) : null}
        </div>

        {/* Grounded */}
        <div className="relative bg-emerald-500/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Still True
            </span>
            <span className="text-xs text-zinc-500">grounded in the graph</span>
          </div>
          {!ran ? (
            <p className="text-sm leading-relaxed text-zinc-500">
              The same question, answered only from cited claims. It gives the current fact, flags where
              sources disagree, and shows its receipts.
            </p>
          ) : loadingG ? (
            <Skeleton grounded />
          ) : grounded ? (
            <>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-100">
                {grounded.answer}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => speak(grounded.answer)}
                  disabled={speaking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-zinc-300 transition-colors hover:border-white/[0.2] hover:text-white disabled:opacity-50"
                >
                  <span aria-hidden>{speaking ? '♪' : '▶'}</span>
                  {speaking ? 'Playing…' : 'Listen'}
                </button>
                {grounded.checkedConflicts ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300 ring-1 ring-inset ring-amber-500/25">
                    flagged the conflict
                  </span>
                ) : null}
                {grounded.readPaths.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-white/[0.04] px-2.5 py-1 font-mono text-zinc-400 ring-1 ring-inset ring-white/[0.06]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Skeleton({grounded = false}: {grounded?: boolean}) {
  const bar = grounded ? 'bg-emerald-400/10' : 'bg-white/[0.06]'
  return (
    <div className="space-y-2.5">
      <div className={`h-3 w-3/4 animate-pulse rounded ${bar}`} />
      <div className={`h-3 w-full animate-pulse rounded ${bar}`} />
      <div className={`h-3 w-5/6 animate-pulse rounded ${bar}`} />
    </div>
  )
}
