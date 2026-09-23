import {getOutline, readEntries, getConflicts} from './context'

const BASE = (process.env.LLM_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '')
const MODEL = process.env.LLM_MODEL || 'MiniMax-M3'

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_knowledge',
      description:
        'List the Knowledge Base outline: every entry path, title, centrality and scope. Call first.',
      parameters: {type: 'object', properties: {}},
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_entries',
      description: 'Read the full cited text of entries by their exact outline paths.',
      parameters: {
        type: 'object',
        properties: {paths: {type: 'array', items: {type: 'string'}}},
        required: ['paths'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_conflicts',
      description:
        'List open conflicts: same fact, two incompatible claims, each with its sources. Check whenever the answer might be contested.',
      parameters: {type: 'object', properties: {}},
    },
  },
]

const system = `You answer developer questions about Next.js strictly from a Sanity Context Knowledge Base.

How to work:
- Call list_knowledge first. It returns the outline: every entry path with its title, scope and centrality. Do not answer from memory.
- Read the outline and pick only the entries whose scope or centrality match the question. Call read_entries once with that focused set of paths. The base is small so prefer a focused set over reading everything.
- If those entries do not answer the question, widen: read more paths, working out from the ones you already read. Only then decide.
- Always call list_conflicts. If a conflict touches the question, surface BOTH claims with their sources, say which one is current and why (recency and source authority), never silently pick one.
- Ground every claim in an entry you read and cite the entry paths you used.
- If after widening the base still does not cover the question, do not guess. Answer with a single line that starts with "Not covered:" and names what is missing.

Keep the answer short.`

type ToolCall = {id: string; function: {name: string; arguments?: string}}
type ChatMessage = {
  role: string
  content?: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

async function runTool(name: string, args: {paths?: string[]}): Promise<unknown> {
  if (name === 'list_knowledge') return getOutline()
  if (name === 'read_entries') return readEntries(args.paths || [])
  if (name === 'list_conflicts') return getConflicts()
  throw new Error(`unknown tool ${name}`)
}

async function chat(messages: ChatMessage[], attempts = 6): Promise<ChatMessage> {
  const key = process.env.LLM_API_KEY
  if (!key) throw new Error('LLM_API_KEY is required')
  let lastErr: Error | null = null
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: MODEL, messages, tools, tool_choice: 'auto', max_tokens: 8192}),
    })
    if (res.ok) {
      const json = (await res.json()) as {choices: {message: ChatMessage}[]}
      return json.choices[0].message
    }
    const body = await res.text()
    lastErr = new Error(`LLM ${res.status}: ${body.slice(0, 200)}`)
    if (res.status !== 429 && res.status < 500) throw lastErr
    await new Promise((r) => setTimeout(r, 700 * (i + 1)))
  }
  throw lastErr ?? new Error('LLM request failed')
}

export type AgentResult = {
  answer: string
  readPaths: string[]
  checkedConflicts: boolean
  // Optional, added fields. The base shape stays backward compatible.
  insufficientEvidence?: boolean
  toolTrace?: string[]
}

export async function ask(question: string): Promise<AgentResult> {
  const messages: ChatMessage[] = [
    {role: 'system', content: system},
    {role: 'user', content: question},
  ]
  const readPaths = new Set<string>()
  const toolTrace: string[] = []
  let checkedConflicts = false

  for (let turn = 0; turn < 8; turn++) {
    const msg = await chat(messages)
    messages.push(msg)
    const calls = msg.tool_calls || []
    if (calls.length === 0) {
      const clean = String(msg.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim()
      const answer = clean || '(no answer)'
      const insufficientEvidence = readPaths.size === 0 || /^\s*not covered\b/i.test(answer)
      return {answer, readPaths: [...readPaths], checkedConflicts, insufficientEvidence, toolTrace}
    }
    for (const call of calls) {
      let content: string
      try {
        const args = call.function.arguments
          ? (JSON.parse(call.function.arguments) as {paths?: string[]})
          : {}
        if (call.function.name === 'read_entries') {
          const paths = args.paths || []
          paths.forEach((p: string) => readPaths.add(p))
          toolTrace.push(`read_entries(${paths.length})`)
        } else {
          toolTrace.push(call.function.name)
        }
        if (call.function.name === 'list_conflicts') checkedConflicts = true
        content = JSON.stringify(await runTool(call.function.name, args))
      } catch (err: unknown) {
        content = `error: ${err instanceof Error ? err.message : String(err)}`
      }
      messages.push({role: 'tool', tool_call_id: call.id, content})
    }
  }
  return {
    answer: '(stopped: too many tool turns)',
    readPaths: [...readPaths],
    checkedConflicts,
    insufficientEvidence: readPaths.size === 0,
    toolTrace,
  }
}
