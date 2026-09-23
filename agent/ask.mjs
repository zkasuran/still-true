import {getOutline, readEntries, getConflicts} from './context.mjs'

// LLM config: any OpenAI-compatible chat-completions gateway.
const BASE = (process.env.LLM_BASE_URL || 'https://api.minimax.io/v1').replace(/\/$/, '')
const KEY = process.env.LLM_API_KEY
const MODEL = process.env.LLM_MODEL || 'MiniMax-M3'
if (!KEY) throw new Error('LLM_API_KEY is required')

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_knowledge',
      description:
        'List the Knowledge Base outline: every entry path, title, centrality and scope. Call this first to see what the base covers.',
      parameters: {type: 'object', properties: {}},
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_entries',
      description: 'Read the full cited text of one or more entries by their exact outline paths.',
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
        'List open conflicts the Knowledge Base raised: same fact, two incompatible claims, each with its sources. Check whenever the answer might be contested.',
      parameters: {type: 'object', properties: {}},
    },
  },
]

async function runTool(name, args) {
  if (name === 'list_knowledge') return getOutline()
  if (name === 'read_entries') return readEntries(args.paths || [])
  if (name === 'list_conflicts') return getConflicts()
  throw new Error(`unknown tool ${name}`)
}

const system = `You answer developer questions about Next.js strictly from a Sanity Context Knowledge Base.

How to work:
- Call list_knowledge first. It returns the outline: every entry path with its title, scope and centrality. Do not answer from your own memory.
- Read the outline and pick only the entries whose scope or centrality match the question. Call read_entries once with that focused set of paths. The base is small so prefer a focused set over reading everything.
- If those entries do not answer the question, widen: read more paths, working out from the ones you already read. Only then decide.
- Always check list_conflicts. If a conflict touches the question, surface BOTH claims with their sources, say which one is current and why (recency and source authority), never silently pick one.
- Ground every claim in an entry you read and cite the entry paths you used.
- If after widening the base still does not cover the question, do not guess. Answer with a single line that starts with "Not covered:" and names what is missing.

Keep the answer short.`

async function chat(messages, attempts = 6) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({model: MODEL, messages, tools, tool_choice: 'auto', max_tokens: 8192}),
    })
    if (res.ok) return (await res.json()).choices[0].message
    const body = await res.text()
    lastErr = new Error(`LLM ${res.status}: ${body.slice(0, 200)}`)
    if (res.status !== 429 && res.status < 500) throw lastErr // non-transient
    await new Promise((r) => setTimeout(r, 800 * (i + 1)))
  }
  throw lastErr
}

async function ask(question) {
  const messages = [
    {role: 'system', content: system},
    {role: 'user', content: question},
  ]
  for (let turn = 0; turn < 8; turn++) {
    const msg = await chat(messages)
    messages.push(msg)
    const calls = msg.tool_calls || []
    if (calls.length === 0)
      return String(msg.content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim() || '(no answer)'
    for (const call of calls) {
      let content
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
        content = JSON.stringify(await runTool(call.function.name, args))
      } catch (err) {
        content = `error: ${err.message}`
      }
      messages.push({role: 'tool', tool_call_id: call.id, content})
    }
  }
  return '(stopped: too many tool turns)'
}

const question = process.argv.slice(2).join(' ').trim()
if (!question) {
  console.error('usage: node --env-file=.env ask.mjs "your question"')
  process.exit(1)
}
console.log(await ask(question))
