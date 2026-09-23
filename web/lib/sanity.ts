import {createClient} from 'next-sanity'
import type {PortableTextBlock} from '@portabletext/react'

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
  body?: PortableTextBlock[]
  source?: Source
}

export type ClaimDetail = Claim & {
  supporting?: Source[]
  outgoing?: {relation: Edge['relation']; reason?: string; to?: {_id: string; statement: string}}[]
  incoming?: {relation: Edge['relation']; reason?: string; from?: {_id: string; statement: string}}[]
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
    _id, statement, topic, confidence, currentAsOf, body,
    "source": primarySource->{title, publisher, authority, url}
  },
  "edges": *[_type == "claimEdge"]{
    relation, reason, confidence,
    "from": from->{_id, statement},
    "to": to->{_id, statement}
  }
}`

export async function getBoard(): Promise<{claims: Claim[]; edges: Edge[]}> {
  try {
    return await client.fetch(boardQuery, {}, {cache: 'no-store'})
  } catch {
    return {claims: [], edges: []}
  }
}

const claimQuery = `*[_type == "claim" && _id == $id][0]{
  _id, statement, topic, confidence, currentAsOf, body,
  "source": primarySource->{title, publisher, authority, url},
  "supporting": supportingSources[]->{title, url, authority},
  "outgoing": *[_type == "claimEdge" && from._ref == ^._id]{relation, reason, "to": to->{_id, statement}},
  "incoming": *[_type == "claimEdge" && to._ref == ^._id]{relation, reason, "from": from->{_id, statement}}
}`

export async function getClaim(id: string): Promise<ClaimDetail | null> {
  try {
    return await client.fetch(claimQuery, {id}, {cache: 'no-store'})
  } catch {
    return null
  }
}
