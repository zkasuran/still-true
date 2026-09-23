import {createClient} from '@sanity/client'

// Server-only. Reads the Sanity Context Knowledge Base: distilled, cited entries
// plus the conflicts Context raises when two sources disagree on the same fact.
//
// Two backends. The default is the @sanity/client Context SDK. If
// SANITY_CONTEXT_MCP_URL is set, outline and entry reads go through the hosted
// Context MCP endpoint over HTTP instead (Knowledge Base mode, which serves the
// two tools initial_context and knowledge_base_read). Conflicts always come from
// the Context issues API, because Knowledge Base mode MCP does not expose them.
const PROJECT = process.env.SANITY_PROJECT_ID || 'mx12urdz'
const ORG = process.env.SANITY_ORG_ID || 'oul432e18'
const KB = process.env.SANITY_KB_ID || 'kbOSaaWFy5yI'
const MCP_URL = process.env.SANITY_CONTEXT_MCP_URL

export type OutlineEntry = {path: string; title: string; centrality?: string; scope?: string}
export type EntryContent = {path: string; title?: string; body?: string; citations?: unknown}
export type Conflict = {
  claim?: string
  currentClaim?: string
  alternativeClaim?: string
  explanation?: string
  scopes?: string[]
}

// initial_context and knowledge_base_read return prose the model reads directly,
// so the MCP shapes carry the raw text rather than a parsed structure.
export type Outline = OutlineEntry[] | {source: 'mcp'; text: string}
export type Entries = EntryContent[] | {source: 'mcp'; paths: string[]; text: string}

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

// The outline the agent sees first: every path with its title, scope and centrality.
export async function getOutline(): Promise<Outline> {
  if (MCP_URL) return {source: 'mcp', text: await mcpTool('initial_context', {})}
  const entries = await contextClient().entries.list()
  return entries.map((e) => ({
    path: e.path,
    title: e.title,
    centrality: e.tldr?.centrality,
    scope: e.tldr?.scope,
  }))
}

// Full cited body for the chosen entries.
export async function readEntries(paths: string[]): Promise<Entries> {
  if (MCP_URL) {
    return {source: 'mcp', paths, text: await mcpTool('knowledge_base_read', {knowledgeBase: KB, paths})}
  }
  const ctx = contextClient()
  const out: EntryContent[] = []
  for (const path of paths) {
    const e = await ctx.entries.get({path})
    if (!e) {
      out.push({path, body: `(no entry at ${path})`})
      continue
    }
    out.push({path, title: e.title, body: e.body, citations: e.citations})
  }
  return out
}

// Open conflicts: same fact, two incompatible claims, each tied to its sources.
async function listIssues(): Promise<Conflict[]> {
  const issues = await contextClient().issues.list()
  return issues.map((i) => ({
    claim: i.content.claimKey,
    currentClaim: i.content.currentClaim,
    alternativeClaim: i.content.alternativeClaim,
    explanation: i.content.issue,
    scopes: i.content.involvedScopes,
  }))
}

export async function getConflicts(): Promise<Conflict[]> {
  // Knowledge Base mode MCP has no conflicts tool, so in MCP mode this is best
  // effort through the issues API and degrades to an empty list when no org
  // token is available. The default SDK path surfaces conflicts as before.
  if (MCP_URL) {
    try {
      return await listIssues()
    } catch {
      return []
    }
  }
  return listIssues()
}

// --- Context MCP client (JSON-RPC 2.0 over streamable HTTP) ------------------
// Only used when SANITY_CONTEXT_MCP_URL is set. Follows the MCP spec: an
// initialize handshake (session id threaded when the server returns one), then
// tools/call. Responses arrive as a single JSON body or as an SSE stream.

type JsonRpcResponse = {
  jsonrpc: '2.0'
  id?: number | string
  result?: {content?: Array<{type: string; text?: string}>; isError?: boolean; structuredContent?: unknown}
  error?: {code: number; message: string}
}

let mcpSessionId: string | undefined
let mcpInitialized = false
let mcpMsgId = 0

function mcpHeaders(): Record<string, string> {
  const token = process.env.SANITY_ORGANIZATION_TOKEN
  if (!token) throw new Error('SANITY_ORGANIZATION_TOKEN is required for the Context MCP endpoint')
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (mcpSessionId) h['Mcp-Session-Id'] = mcpSessionId
  return h
}

async function readRpc(res: Response): Promise<JsonRpcResponse | null> {
  const body = await res.text()
  if (!body) return null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/event-stream')) {
    const dataLines = body
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
    for (let i = dataLines.length - 1; i >= 0; i--) {
      try {
        const j = JSON.parse(dataLines[i]) as JsonRpcResponse
        if (j && (j.result || j.error)) return j
      } catch {
        // not a JSON-RPC frame, keep scanning
      }
    }
    return null
  }
  return JSON.parse(body) as JsonRpcResponse
}

async function mcpInitialize(): Promise<void> {
  if (mcpInitialized) return
  try {
    const res = await fetch(MCP_URL as string, {
      method: 'POST',
      headers: mcpHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++mcpMsgId,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {name: 'still-true', version: '1.0.0'},
        },
      }),
    })
    const sid = res.headers.get('mcp-session-id')
    if (sid) mcpSessionId = sid
    await readRpc(res).catch(() => null)
    if (res.ok) {
      await fetch(MCP_URL as string, {
        method: 'POST',
        headers: mcpHeaders(),
        body: JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'}),
      }).catch(() => undefined)
    }
  } catch {
    // A stateless endpoint may reject initialize. Proceed to the tool call anyway.
  }
  mcpInitialized = true
}

async function mcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (!MCP_URL) throw new Error('SANITY_CONTEXT_MCP_URL is not set')
  await mcpInitialize()
  const call = () =>
    fetch(MCP_URL, {
      method: 'POST',
      headers: mcpHeaders(),
      body: JSON.stringify({jsonrpc: '2.0', id: ++mcpMsgId, method: 'tools/call', params: {name, arguments: args}}),
    })
  let res = await call()
  if (res.status === 404 && mcpSessionId) {
    // Session expired. Re-initialize once, then retry.
    mcpInitialized = false
    mcpSessionId = undefined
    await mcpInitialize()
    res = await call()
  }
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Context MCP ${res.status}: ${t.slice(0, 200)}`)
  }
  const rpc = await readRpc(res)
  if (!rpc) throw new Error('Context MCP: empty response')
  if (rpc.error) throw new Error(`Context MCP: ${rpc.error.message}`)
  const text = (rpc.result?.content || [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n')
    .trim()
  if (rpc.result?.isError) throw new Error(`Context MCP tool error: ${text || name}`)
  return text || JSON.stringify(rpc.result?.structuredContent ?? rpc.result ?? {})
}
