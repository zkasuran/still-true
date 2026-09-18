import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'

// Reads a Sanity Context Knowledge Base through the official client. The KB is
// built from source documents that Sanity Context distils into cited entries and,
// where two sources disagree on the same fact, an open issue that names both claims.
const PROJECT = process.env.SANITY_PROJECT_ID || 'mx12urdz'
const ORG = process.env.SANITY_ORG_ID || 'oul432e18'
const KB = process.env.SANITY_KB_ID || 'kbOSaaWFy5yI'

// A token with Context read access. In production set SANITY_ORGANIZATION_TOKEN (a scoped org token
// with Context Viewer). For local dev we fall back to the logged-in CLI token if the env var is unset.
function resolveToken() {
  if (process.env.SANITY_ORGANIZATION_TOKEN) return process.env.SANITY_ORGANIZATION_TOKEN
  try {
    const cfg = JSON.parse(readFileSync(`${process.env.HOME}/.config/sanity/config.json`, 'utf8'))
    if (cfg.authToken) return cfg.authToken
  } catch {}
  throw new Error('No Sanity token: set SANITY_ORGANIZATION_TOKEN or run `sanity login`')
}
const token = resolveToken()

const ctx = createClient({
  projectId: PROJECT,
  dataset: 'production',
  apiVersion: '2026-08-25',
  useCdn: false,
  token,
  context: {organizationId: ORG},
  resource: {type: 'knowledge-base', id: KB},
}).context

// The outline the agent sees first, the same shape Context's initial_context returns.
export async function getOutline() {
  const entries = await ctx.entries.list()
  return entries.map((e) => ({
    path: e.path,
    title: e.title,
    centrality: e.tldr?.centrality,
    scope: e.tldr?.scope,
  }))
}

// Full cited body for the chosen entries.
export async function readEntries(paths) {
  const out = []
  for (const path of paths) {
    const e = await ctx.entries.get({path})
    out.push({path, title: e.title, body: e.body, citations: e.citations})
  }
  return out
}

// Open conflicts: same fact, two incompatible claims, each tied to its sources.
export async function getConflicts() {
  const issues = await ctx.issues.list()
  return issues.map((i) => ({
    claim: i.content?.claimKey,
    currentClaim: i.content?.currentClaim,
    alternativeClaim: i.content?.alternativeClaim,
    explanation: i.content?.issue,
    scopes: i.content?.involvedScopes,
  }))
}
