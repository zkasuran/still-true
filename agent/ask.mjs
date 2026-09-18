import Anthropic from '@anthropic-ai/sdk'
import {getOutline, readEntries, getConflicts} from './context.mjs'

const MODEL = process.env.AGENT_MODEL || 'claude-opus-5'

const anthropic = new Anthropic({maxRetries: 5}) // reads ANTHROPIC_AUTH_TOKEN / ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL

async function createWithRetry(params, attempts = 6) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await anthropic.messages.create(params)
    } catch (err) {
      lastErr = err
      const status = err?.status
      if (status && status !== 429 && status < 500) throw err // non-transient
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastErr
}

const tools = [
  {
    name: 'list_knowledge',
    description:
      'List the Knowledge Base outline: every entry path, title, centrality and scope. Call this first to see what the base covers before reading anything.',
    input_schema: {type: 'object', properties: {}},
  },
  {
    name: 'read_entries',
    description:
      'Read the full cited text of one or more entries by their exact paths from the outline.',
    input_schema: {
      type: 'object',
      properties: {paths: {type: 'array', items: {type: 'string'}}},
      required: ['paths'],
    },
  },
  {
    name: 'list_conflicts',
    description:
      'List open conflicts the Knowledge Base raised: places where two sources assert the same fact incompatibly, each with its claim. Check this whenever the answer might be contested.',
    input_schema: {type: 'object', properties: {}},
  },
]

async function runTool(name, input) {
  if (name === 'list_knowledge') return getOutline()
  if (name === 'read_entries') return readEntries(input.paths || [])
  if (name === 'list_conflicts') return getConflicts()
  throw new Error(`unknown tool ${name}`)
}

const system = `You answer developer questions about the Claude API strictly from a Sanity Context Knowledge Base.

Rules:
- Ground every answer in entries you have read. Do not answer from your own memory. If the base does not cover it, say so plainly.
- Call list_knowledge first, then read_entries for the relevant paths.
- Always check list_conflicts. If a conflict touches the question, surface BOTH claims with their sources, say which one is current and why (recency and source authority), and never silently pick one.
- Keep the answer short and cite the entry paths you used.`

async function ask(question) {
  const messages = [{role: 'user', content: question}]
  for (let turn = 0; turn < 8; turn++) {
    const res = await createWithRetry({
      model: MODEL,
      max_tokens: 4096,
      system,
      tools,
      messages,
    })
    messages.push({role: 'assistant', content: res.content})

    const toolUses = res.content.filter((b) => b.type === 'tool_use')
    if (res.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const text = res.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
      return text
    }

    const toolResults = []
    for (const tu of toolUses) {
      try {
        const result = await runTool(tu.name, tu.input)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: `error: ${err.message}`,
          is_error: true,
        })
      }
    }
    messages.push({role: 'user', content: toolResults})
  }
  return '(stopped: too many tool turns)'
}

const question = process.argv.slice(2).join(' ').trim()
if (!question) {
  console.error('usage: node ask.mjs "your question"')
  process.exit(1)
}
console.log(await ask(question))
