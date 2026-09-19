'use client'

import {useMemo, useState} from 'react'
import type {Claim, Edge} from '@/lib/sanity'
import {sfx} from '../lib/sound'

const EDGE_COLOR: Record<Edge['relation'], string> = {
  contradicts: '#fbbf24',
  supersedes: '#38bdf8',
  supports: '#34d399',
}
const EDGE_LABEL: Record<Edge['relation'], string> = {
  contradicts: 'contradicts',
  supersedes: 'supersedes',
  supports: 'supports',
}

function shortLabel(s: string) {
  const w = s.replace(/`/g, '').split(' ')
  let out = ''
  for (const word of w) {
    if ((out + ' ' + word).trim().length > 26) break
    out = (out + ' ' + word).trim()
  }
  return out + (out.length < s.length ? '…' : '')
}

export default function ContradictionGraph({claims, edges}: {claims: Claim[]; edges: Edge[]}) {
  const [active, setActive] = useState<string | null>(null)

  const W = 640
  const H = 440
  const cx = W / 2
  const cy = H / 2
  const r = Math.min(W, H) / 2 - 70

  // order claims so topic pairs sit next to each other -> short, readable arcs
  const ordered = useMemo(
    () =>
      [...claims].sort((a, b) =>
        (a.topic ?? '').localeCompare(b.topic ?? '') || a._id.localeCompare(b._id),
      ),
    [claims],
  )

  const pos = useMemo(() => {
    const m = new Map<string, {x: number; y: number; a: number}>()
    const n = ordered.length || 1
    ordered.forEach((c, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2
      m.set(c._id, {x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a})
    })
    return m
  }, [ordered, cx, cy, r])

  const activeEdges = edges.filter(
    (e) => active && ((e.from && e.from._id === active) || (e.to && e.to._id === active)),
  )
  const activeClaim = ordered.find((c) => c._id === active) ?? null

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[var(--b1)] bg-[var(--s1)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Contradiction graph">
          {/* edges */}
          {edges.map((e, i) => {
            const from = e.from && pos.get(e.from._id)
            const to = e.to && pos.get(e.to._id)
            if (!from || !to) return null
            const dim = active && !(e.from?._id === active || e.to?._id === active)
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            const ctrlx = mx + (cx - mx) * 0.55
            const ctrly = my + (cy - my) * 0.55
            return (
              <path
                key={i}
                d={`M ${from.x} ${from.y} Q ${ctrlx} ${ctrly} ${to.x} ${to.y}`}
                fill="none"
                stroke={EDGE_COLOR[e.relation]}
                strokeWidth={e.relation === 'contradicts' ? 2.4 : 1.8}
                strokeDasharray={e.relation === 'supersedes' ? '5 4' : undefined}
                opacity={dim ? 0.12 : 0.75}
                className="transition-opacity"
              />
            )
          })}
          {/* nodes */}
          {ordered.map((c) => {
            const p = pos.get(c._id)!
            const isActive = active === c._id
            const dim = active && !isActive && !activeEdges.some((e) => e.from?._id === c._id || e.to?._id === c._id)
            const right = p.x >= cx
            return (
              <g
                key={c._id}
                className="cursor-pointer"
                opacity={dim ? 0.3 : 1}
                onMouseEnter={() => {
                  setActive(c._id)
                  sfx.tick()
                }}
                onClick={() => setActive(isActive ? null : c._id)}
              >
                <circle cx={p.x} cy={p.y} r={isActive ? 8 : 5.5} fill={isActive ? '#34d399' : '#a1a1aa'} />
                <circle cx={p.x} cy={p.y} r={13} fill="transparent" />
                <text
                  x={p.x + (right ? 12 : -12)}
                  y={p.y + 4}
                  textAnchor={right ? 'start' : 'end'}
                  className="fill-[var(--t2)] text-[11px]"
                  style={{fontSize: 11}}
                >
                  {shortLabel(c.statement)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* legend + detail */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--t3)]">
        {(['contradicts', 'supersedes', 'supports'] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{background: EDGE_COLOR[k]}} />
            {k}
          </span>
        ))}
        <span className="ml-auto hidden sm:inline">hover a node to trace its links</span>
      </div>

      {activeClaim ? (
        <div className="mt-4 rounded-xl border border-[var(--b2)] bg-[var(--s1)] p-4">
          <p className="text-sm text-[var(--t1)]">{activeClaim.statement}</p>
          <div className="mt-2 text-xs text-[var(--t3)]">
            {activeClaim.topic} · {activeClaim.source?.authority ?? 'unknown'} source
          </div>
          {activeEdges.length ? (
            <div className="mt-3 space-y-2 border-t border-[var(--b1)] pt-3">
              {activeEdges.map((e, i) => {
                const other = e.from?._id === active ? e.to : e.from
                const dir = e.from?._id === active ? EDGE_LABEL[e.relation] : `is ${e.relation} by`
                return (
                  <div key={i} className="text-xs">
                    <span style={{color: EDGE_COLOR[e.relation]}}>{dir}</span>{' '}
                    <span className="text-[var(--t2)]">{other?.statement}</span>
                    {e.reason ? <div className="mt-0.5 text-[var(--t4)]">{e.reason}</div> : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
