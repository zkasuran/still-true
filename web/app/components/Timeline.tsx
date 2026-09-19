'use client'

import {useMemo, useState} from 'react'
import type {Claim} from '@/lib/sanity'

function ts(d?: string) {
  return d ? Date.parse(d) : 0
}
function fmt(t: number) {
  const d = new Date(t)
  return d.toLocaleDateString('en-US', {month: 'short', year: 'numeric'})
}

export default function Timeline({claims}: {claims: Claim[]}) {
  const dated = useMemo(() => claims.filter((c) => c.currentAsOf), [claims])
  const min = useMemo(() => Math.min(...dated.map((c) => ts(c.currentAsOf))), [dated])
  const max = useMemo(() => Math.max(...dated.map((c) => ts(c.currentAsOf))), [dated])
  const [v, setV] = useState(1000) // 0..1000, start at "now"

  const at = min + ((max - min) * v) / 1000

  const topics = useMemo(() => {
    const m = new Map<string, Claim[]>()
    for (const c of dated) {
      const k = c.topic ?? 'Other'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(c)
    }
    return [...m.entries()]
  }, [dated])

  return (
    <div className="rounded-2xl border border-[var(--b1)] bg-[var(--s1)] p-6">
      <div className="mb-5 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-[var(--t3)]">the current truth, as of</span>
        <span className="font-mono text-lg font-semibold text-[var(--accent-emerald)]">{fmt(at)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1000}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="w-full accent-emerald-400"
        aria-label="Scrub through time"
      />
      <div className="mb-6 mt-1 flex justify-between text-[11px] text-[var(--t4)]">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>

      <div className="space-y-3">
        {topics.map(([topic, cs]) => {
          const past = cs
            .filter((c) => ts(c.currentAsOf) <= at)
            .sort((a, b) => ts(b.currentAsOf) - ts(a.currentAsOf))
          const active = past[0]
          const older = past.slice(1)
          const future = cs.filter((c) => ts(c.currentAsOf) > at).sort((a, b) => ts(a.currentAsOf) - ts(b.currentAsOf))[0]
          return (
            <div key={topic} className="rounded-xl border border-[var(--b1)] bg-[var(--s0)] p-4">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--t3)]">
                {topic}
              </div>
              {active ? (
                <p className="text-sm leading-relaxed text-[var(--t1)] transition-colors">{active.statement}</p>
              ) : future ? (
                <p className="text-sm italic leading-relaxed text-[var(--t4)]">not established yet at this date</p>
              ) : null}
              {older.length ? (
                <p className="mt-1.5 text-xs text-[var(--t4)] line-through decoration-zinc-700">
                  was: {older[0].statement}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
