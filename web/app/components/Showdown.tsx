'use client'

import {useState} from 'react'
import {sfx} from '../lib/sound'
import Answer from './Answer'

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
    sfx.send()
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
      .then((d) => {
        const g = d.error ? {answer: d.error, readPaths: [], checkedConflicts: false} : d
        setGrounded(g)
        if (g.checkedConflicts) sfx.alert()
        else sfx.chime()
      })
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
    <div className="overflow-hidden rounded-2xl border border-[var(--b2)] bg-gradient-to-b from-[var(--s2)] to-[var(--s1)] shadow-2xl shadow-black/40">
      <form
        className="border-b border-[var(--b1)] p-4"
        onSubmit={(e) => {
          e.preventDefault()
          run(q)
        }}
      >
        <div className="flex items-end gap-2 rounded-xl border border-[var(--b2)] bg-[var(--inset)] p-2 focus-within:border-emerald-400/40">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a Next.js question…"
            className="w-full bg-transparent px-2 py-1.5 text-[15px] text-[var(--t1)] placeholder:text-[var(--t4)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loadingN || loadingG}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
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
                className="rounded-full border border-[var(--b1)] bg-[var(--s1)] px-3 py-1.5 text-xs text-[var(--t2)] transition-colors hover:border-emerald-400/30 hover:text-[var(--t2)]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </form>

      <div className="grid grid-cols-1 divide-y divide-[var(--b1)] md:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Ungrounded */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--t2)]">
              Plain model
            </span>
            <span className="text-xs text-[var(--t4)]">no sources</span>
          </div>
          {!ran ? (
            <p className="text-sm leading-relaxed text-[var(--t4)]">
              What the model says on its own, from training data. Confident and uncited. It does not
              know when it is out of date.
            </p>
          ) : loadingN ? (
            <Skeleton />
          ) : (
            <Answer text={naive || ''} tone="muted" />
          )}
          {ran && !loadingN ? (
            <div className="mt-4 text-xs text-[var(--t4)]">no sources · no conflict check</div>
          ) : null}
        </div>

        {/* Grounded */}
        <div className="relative bg-emerald-500/[0.02] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-emerald)]">
              Still True
            </span>
            <span className="text-xs text-[var(--t3)]">grounded in the graph</span>
          </div>
          {!ran ? (
            <p className="text-sm leading-relaxed text-[var(--t3)]">
              The same question, answered only from cited claims. It gives the current fact, flags where
              sources disagree and shows its receipts.
            </p>
          ) : loadingG ? (
            <Skeleton grounded />
          ) : grounded ? (
            <>
              <Answer text={grounded.answer} />
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => speak(grounded.answer)}
                  disabled={speaking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--b2)] bg-[var(--s1)] px-2.5 py-1 text-[var(--t2)] transition-colors hover:border-[var(--b2)] hover:text-[var(--t1)] disabled:opacity-50"
                >
                  <span aria-hidden>{speaking ? '♪' : '▶'}</span>
                  {speaking ? 'Playing…' : 'Listen'}
                </button>
                {grounded.checkedConflicts ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[var(--accent-amber)] ring-1 ring-inset ring-amber-500/25">
                    flagged the conflict
                  </span>
                ) : null}
                {grounded.readPaths.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-[var(--s2)] px-2.5 py-1 font-mono text-[var(--t2)] ring-1 ring-inset ring-[var(--b1)]"
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
  const bar = grounded ? 'bg-emerald-400/10' : 'bg-[var(--s2)]'
  return (
    <div className="space-y-2.5">
      <div className={`h-3 w-3/4 animate-pulse rounded ${bar}`} />
      <div className={`h-3 w-full animate-pulse rounded ${bar}`} />
      <div className={`h-3 w-5/6 animate-pulse rounded ${bar}`} />
    </div>
  )
}
