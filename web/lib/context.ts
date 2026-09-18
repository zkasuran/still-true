import {createClient} from '@sanity/client'

// Server-only. Reads the Sanity Context Knowledge Base: distilled, cited entries
// plus the conflicts Context raises when two sources disagree on the same fact.
const PROJECT = process.env.SANITY_PROJECT_ID || 'mx12urdz'
const ORG = process.env.SANITY_ORG_ID || 'oul432e18'
const KB = process.env.SANITY_KB_ID || 'kbOSaaWFy5yI'

function contextClient() {
  const token = process.env.SANITY_ORGANIZATION_TOKEN
  if (!token) throw new Error('SANITY_ORGANIZATION_TOKEN is required for Context access')
  return createClient({
    projectId: PROJECT,
    dataset: 'production',
    apiVersion: '2026-08-25',
    useCdn: false,
    token,
    context: {organizationId: ORG},
    resource: {type: 'knowledge-base', id: KB},
  }).context
}

export type OutlineEntry = {path: string; title: string; centrality?: string; scope?: string}

export async function getOutline(): Promise<OutlineEntry[]> {
  const entries = await contextClient().entries.list()
  return entries.map((e: any) => ({
    path: e.path,
    title: e.title,
    centrality: e.tldr?.centrality,
    scope: e.tldr?.scope,
  }))
}

export async function readEntries(paths: string[]) {
  const ctx = contextClient()
  const out = []
  for (const path of paths) {
    const e: any = await ctx.entries.get({path})
    out.push({path, title: e.title, body: e.body, citations: e.citations})
  }
  return out
}

export async function getConflicts() {
  const issues = await contextClient().issues.list()
  return issues.map((i: any) => ({
    claim: i.content?.claimKey,
    currentClaim: i.content?.currentClaim,
    alternativeClaim: i.content?.alternativeClaim,
    explanation: i.content?.issue,
    scopes: i.content?.involvedScopes,
  }))
}
