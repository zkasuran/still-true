import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'

// Reads a Sanity Context Knowledge Base. Two backends. The default is the
// @sanity/client Context SDK. Set SANITY_CONTEXT_MCP_URL and reads go through the
// hosted Context MCP endpoint over HTTP instead (Knowledge Base mode, which serves
// the two tools initial_context and knowledge_base_read). Conflicts always come
// from the Context issues API, because Knowledge Base mode MCP does not expose them.
const PROJECT = process.env.SANITY_PROJECT_ID || 'mx12urdz'
const ORG = process.env.SANITY_ORG_ID || 'oul432e18'
const KB = process.env.SANITY_KB_ID || 'kbOSaaWFy5yI'
const MCP_URL = process.env.SANITY_CONTEXT_MCP_URL

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

let _ctx
function ctxClient() {
  if (_ctx) return _ctx
  _ctx = createClient({
    projectId: PROJECT,
    dataset: 'production',
    apiVersion: '2026-08-25',
    useCdn: false,
    token: resolveToken(),
    context: {organizationId: ORG},
    resource: {type: 'knowledge-base', id: KB},
  }).context
  return _ctx
}

// The outline the agent sees first, the same shape Context's initial_context returns.
export async function getOutline() {
  if (MCP_URL) return {source: 'mcp', text: await mcpTool('initial_context', {})}
  const entries = await ctxClient().entries.list()
  return entries.map((e) => ({
    path: e.path,
    title: e.title,
    centrality: e.tldr?.centrality,
    scope: e.tldr?.scope,
  }))
}

// Full cited body for the chosen entries.
export async function readEntries(paths) {
  if (MCP_URL) {
    return {source: 'mcp', paths, text: await mcpTool('knowledge_base_read', {knowledgeBase: KB, paths})}
  }
  const ctx = ctxClient()
  const out = []
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
async function listIssues() {
  const issues = await ctxClient().issues.list()
  return issues.map((i) => ({
    claim: i.content?.claimKey,
    currentClaim: i.content?.currentClaim,
    alternativeClaim: i.content?.alternativeClaim,
    explanation: i.content?.issue,
    scopes: i.content?.involvedScopes,
  }))
}

export async function getConflicts() {
  // Knowledge Base mode MCP has no conflicts tool, so in MCP mode this is best
  // effort through the issues API and degrades to an empty list when no token is
  // available. The default SDK path surfaces conflicts as before.
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
let mcpSessionId
let mcpInitialized = false
let mcpMsgId = 0

function mcpHeaders() {
  const h = {
    Authorization: `Bearer ${resolveToken()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (mcpSessionId) h['Mcp-Session-Id'] = mcpSessionId
  return h
}

async function readRpc(res) {
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
        const j = JSON.parse(dataLines[i])
        if (j && (j.result || j.error)) return j
      } catch {}
    }
    return null
  }
  return JSON.parse(body)
}

async function mcpInitialize() {
  if (mcpInitialized) return
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: mcpHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++mcpMsgId,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {name: 'still-true-agent', version: '1.0.0'},
        },
      }),
    })
    const sid = res.headers.get('mcp-session-id')
    if (sid) mcpSessionId = sid
    await readRpc(res).catch(() => null)
    if (res.ok) {
      await fetch(MCP_URL, {
        method: 'POST',
        headers: mcpHeaders(),
        body: JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'}),
      }).catch(() => {})
    }
  } catch {
    // A stateless endpoint may reject initialize. Proceed to the tool call anyway.
  }
  mcpInitialized = true
}

async function mcpTool(name, args) {
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
