import {getOutline, readEntries, getConflicts} from './context'

const BASE = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const MODEL = process.env.LLM_MODEL || 'gpt-5.6-sol'

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

const system = `You answer developer questions about the Claude API strictly from a Sanity Context Knowledge Base.

Rules:
- Ground every answer in entries you have read. Do not answer from memory. If the base does not cover it, say so.
- Call list_knowledge first. The base is small, so then call read_entries with EVERY outline path in one call. Do not answer after reading only one or two entries, you will miss the relevant fact.
- Always call list_conflicts. If a conflict touches the question, surface BOTH claims with their sources, say which is current and why, and never silently pick one.
- Keep the answer short and cite the entry paths you used.`

async function runTool(name: string, args: any) {
  if (name === 'list_knowledge') return getOutline()
  if (name === 'read_entries') return readEntries(args.paths || [])
  if (name === 'list_conflicts') return getConflicts()
  throw new Error(`unknown tool ${name}`)
}

async function chat(messages: any[], attempts = 6): Promise<any> {
  const key = process.env.LLM_API_KEY
  if (!key) throw new Error('LLM_API_KEY is required')
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: MODEL, messages, tools, tool_choice: 'auto', max_tokens: 8192}),
    })
    if (res.ok) return (await res.json()).choices[0].message
    const body = await res.text()
    lastErr = new Error(`LLM ${res.status}: ${body.slice(0, 200)}`)
    if (res.status !== 429 && res.status < 500) throw lastErr
    await new Promise((r) => setTimeout(r, 700 * (i + 1)))
  }
  throw lastErr
}

export type AgentResult = {answer: string; readPaths: string[]; checkedConflicts: boolean}

export async function ask(question: string): Promise<AgentResult> {
  const messages: any[] = [
    {role: 'system', content: system},
    {role: 'user', content: question},
  ]
  const readPaths = new Set<string>()
  let checkedConflicts = false

  for (let turn = 0; turn < 8; turn++) {
    const msg = await chat(messages)
    messages.push(msg)
    const calls = msg.tool_calls || []
    if (calls.length === 0) {
      const clean = String(msg.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim()
      return {answer: clean || '(no answer)', readPaths: [...readPaths], checkedConflicts}
    }
    for (const call of calls) {
      let content: string
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
        if (call.function.name === 'read_entries') (args.paths || []).forEach((p: string) => readPaths.add(p))
        if (call.function.name === 'list_conflicts') checkedConflicts = true
        content = JSON.stringify(await runTool(call.function.name, args))
      } catch (err: any) {
        content = `error: ${err.message}`
      }
      messages.push({role: 'tool', tool_call_id: call.id, content})
    }
  }
  return {answer: '(stopped: too many tool turns)', readPaths: [...readPaths], checkedConflicts}
}
