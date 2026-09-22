import {describe, it, expect} from 'vitest'

// Copies the pure time logic from web/app/components/Timeline.tsx: the slider
// position (0..1000) to timestamp mapping, and the per-topic selection of which
// claim is "current" at a given moment (the newest claim on or before that time,
// with older ones marked superseded and future ones not yet established).
type C = {_id: string; statement: string; topic?: string; currentAsOf?: string}

function ts(d?: string) {
  return d ? Date.parse(d) : 0
}

function positionToTime(min: number, max: number, v: number) {
  return min + ((max - min) * v) / 1000
}

function truthAt(claims: C[], at: number) {
  const byTopic = new Map<string, C[]>()
  for (const c of claims.filter((c) => c.currentAsOf)) {
    const k = c.topic ?? 'Other'
    if (!byTopic.has(k)) byTopic.set(k, [])
    byTopic.get(k)!.push(c)
  }
  const out = new Map<string, {active?: C; older: C[]; future?: C}>()
  for (const [topic, cs] of byTopic) {
    const past = cs
      .filter((c) => ts(c.currentAsOf) <= at)
      .sort((a, b) => ts(b.currentAsOf) - ts(a.currentAsOf))
    const future = cs
      .filter((c) => ts(c.currentAsOf) > at)
      .sort((a, b) => ts(a.currentAsOf) - ts(b.currentAsOf))[0]
    out.set(topic, {active: past[0], older: past.slice(1), future})
  }
  return out
}

const min = Date.parse('2020-01-01')
const max = Date.parse('2024-01-01')

describe('positionToTime (slider to timestamp)', () => {
  it('maps the ends of the range to min and max', () => {
    expect(positionToTime(min, max, 0)).toBe(min)
    expect(positionToTime(min, max, 1000)).toBe(max)
  })

  it('maps the midpoint of the slider to the midpoint of the range', () => {
    expect(positionToTime(min, max, 500)).toBe((min + max) / 2)
  })
})

describe('truthAt (which claim is current)', () => {
  const claims: C[] = [
    {_id: 'route-legacy', statement: 'Use the Pages Router', topic: 'Routing', currentAsOf: '2020-01-01'},
    {_id: 'route-current', statement: 'Use the App Router', topic: 'Routing', currentAsOf: '2023-01-01'},
    {_id: 'no-date', statement: 'undated claim', topic: 'Routing'},
  ]

  it('picks the legacy claim before the newer one takes effect', () => {
    const at = Date.parse('2021-06-01')
    const row = truthAt(claims, at).get('Routing')!
    expect(row.active?._id).toBe('route-legacy')
    expect(row.future?._id).toBe('route-current')
    expect(row.older).toHaveLength(0)
  })

  it('flips to the newer claim once its date has passed and marks the old one superseded', () => {
    const at = Date.parse('2023-06-01')
    const row = truthAt(claims, at).get('Routing')!
    expect(row.active?._id).toBe('route-current')
    expect(row.older.map((c) => c._id)).toEqual(['route-legacy'])
    expect(row.future).toBeUndefined()
  })

  it('ignores claims that carry no date', () => {
    const at = Date.parse('2023-06-01')
    const row = truthAt(claims, at).get('Routing')!
    const seen = [row.active, ...row.older, row.future].filter(Boolean).map((c) => c!._id)
    expect(seen).not.toContain('no-date')
  })
})
