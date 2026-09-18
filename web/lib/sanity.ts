import {createClient} from 'next-sanity'

export const client = createClient({
  projectId: 'mx12urdz',
  dataset: 'production',
  apiVersion: '2025-02-19',
  useCdn: true,
})

export type Source = {
  title: string
  publisher?: string
  authority?: 'official' | 'maintainer' | 'community' | 'unknown'
  url?: string
}

export type Claim = {
  _id: string
  statement: string
  topic?: string
  confidence?: number
  currentAsOf?: string
  source?: Source
}

export type Edge = {
  relation: 'supports' | 'contradicts' | 'supersedes'
  reason?: string
  confidence?: number
  from?: {_id: string; statement: string}
  to?: {_id: string; statement: string}
}

const boardQuery = `{
  "claims": *[_type == "claim"] | order(topic asc, confidence desc){
    _id, statement, topic, confidence, currentAsOf,
    "source": primarySource->{title, publisher, authority, url}
  },
  "edges": *[_type == "claimEdge"]{
    relation, reason, confidence,
    "from": from->{_id, statement},
    "to": to->{_id, statement}
  }
}`

export async function getBoard(): Promise<{claims: Claim[]; edges: Edge[]}> {
  return client.fetch(boardQuery, {}, {cache: 'no-store'})
}
