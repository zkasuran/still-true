import {describe, it, expect} from 'vitest'

// Copies the pure board helpers from web/app/page.tsx (which claims are
// superseded, how many are contested, topic grouping) and the label shortener
// from web/app/components/ContradictionGraph.tsx. These drive what the board
// renders, so a regression here changes the page even though no network is hit.
type Claim = {_id: string; statement: string; topic?: string}
type Edge = {
  relation: 'supports' | 'contradicts' | 'supersedes'
  from?: {_id: string}
  to?: {_id: string}
}

function supersededIds(edges: Edge[]) {
  return new Set(edges.filter((e) => e.relation === 'supersedes' && e.to).map((e) => e.to!._id))
}

function contestedCount(edges: Edge[]) {
  return edges.filter((e) => e.relation === 'contradicts').length
}

function groupByTopic(claims: Claim[]) {
  const topics = new Map<string, Claim[]>()
  for (const c of claims) {
    const key = c.topic ?? 'Uncategorized'
    if (!topics.has(key)) topics.set(key, [])
    topics.get(key)!.push(c)
  }
  return topics
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

const edges: Edge[] = [
  {relation: 'supersedes', from: {_id: 'a2'}, to: {_id: 'a1'}},
  {relation: 'supersedes', from: {_id: 'b2'}, to: {_id: 'b1'}},
  {relation: 'contradicts', from: {_id: 'c1'}, to: {_id: 'c2'}},
  {relation: 'supports', from: {_id: 'd1'}, to: {_id: 'd2'}},
  {relation: 'supersedes', from: {_id: 'e2'}}, // no `to`, must be ignored
]

describe('supersededIds', () => {
  it('collects the target of every supersedes edge and nothing else', () => {
    const ids = supersededIds(edges)
    expect([...ids].sort()).toEqual(['a1', 'b1'])
    expect(ids.has('c2')).toBe(false)
    expect(ids.has('d2')).toBe(false)
  })

  it('skips supersedes edges that have no target', () => {
    expect(supersededIds(edges).has('e2')).toBe(false)
  })
})

describe('contestedCount', () => {
  it('counts only contradicts edges', () => {
    expect(contestedCount(edges)).toBe(1)
  })
})

describe('groupByTopic', () => {
  const claims: Claim[] = [
    {_id: '1', statement: 'x', topic: 'Routing'},
    {_id: '2', statement: 'y', topic: 'Routing'},
    {_id: '3', statement: 'z', topic: 'Fonts'},
    {_id: '4', statement: 'w'},
  ]

  it('groups claims by topic and falls back to Uncategorized', () => {
    const g = groupByTopic(claims)
    expect(g.get('Routing')?.map((c) => c._id)).toEqual(['1', '2'])
    expect(g.get('Fonts')?.map((c) => c._id)).toEqual(['3'])
    expect(g.get('Uncategorized')?.map((c) => c._id)).toEqual(['4'])
  })
})

describe('shortLabel', () => {
  it('leaves a short statement unchanged with no ellipsis', () => {
    expect(shortLabel('App Router')).toBe('App Router')
  })

  it('truncates a long statement on a word boundary and adds an ellipsis', () => {
    const label = shortLabel('fetch is not cached by default in the App Router')
    expect(label.endsWith('…')).toBe(true)
    expect(label.startsWith('fetch is not cached by')).toBe(true)
    expect(label.length).toBeLessThan('fetch is not cached by default in the App Router'.length)
  })

  it('strips backticks from the label', () => {
    expect(shortLabel('`fetch` caching')).not.toContain('`')
  })
})
