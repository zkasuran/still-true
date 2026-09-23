import {type DocumentHandle} from '@sanity/sdk'

/** Sanity project this app reads and writes. */
export const PROJECT_ID = 'mx12urdz'
export const DATASET = 'production'

export type Relation = 'supports' | 'contradicts' | 'supersedes'

/** One claimEdge, resolved with the statements of both endpoints for display. */
export interface EdgeView {
  _id: string
  relation: Relation | null
  reason: string | null
  confidence: number | null
  decidedAt: string | null
  fromId: string | null
  toId: string | null
  fromStatement: string | null
  toStatement: string | null
}

/** Fields shown for a claim row in the list. */
export interface ClaimRowFields {
  statement: string | null
  topic: string | null
  confidence: number | null
}

/** A resolved source reference. */
export interface SourceRef {
  _id: string
  title: string | null
  url: string | null
  publisher: string | null
  authority: string | null
}

/** Fields shown in the claim detail pane. */
export interface ClaimDetailFields {
  statement: string | null
  topic: string | null
  confidence: number | null
  currentAsOf: string | null
  bodyText: string | null
  triageReviewed: boolean | null
  triageReviewedAt: string | null
  primarySource: SourceRef | null
  supportingSources: SourceRef[] | null
}

/** Live document fields read with optimistic updates for the editor. */
export interface ClaimEditableFields {
  confidence?: number
  triageReviewed?: boolean
}

/** Conflict summary for a single claim, built from all edges. */
export interface ClaimConflict {
  contradicts: EdgeView[]
  supersedes: EdgeView[]
  supports: EdgeView[]
}

export type ClaimHandle = DocumentHandle
