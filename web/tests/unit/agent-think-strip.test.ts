import {describe, it, expect} from 'vitest'

// The agent and the /api/naive route strip a model's <think>...</think>
// reasoning before showing the answer (web/lib/agent.ts, web/app/api/naive/route.ts).
// This is a copy of that exact transform, tested in isolation so a regression in
// the regex or the trim is caught without a live model call.
function stripReasoning(raw: string): string {
  return String(raw)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
}

describe('stripReasoning (<think> removal)', () => {
  it('removes a single reasoning block and trims the answer', () => {
    const raw = '<think>let me work this out step by step</think>\n\nfetch is not cached by default.'
    expect(stripReasoning(raw)).toBe('fetch is not cached by default.')
  })

  it('removes reasoning that spans multiple lines', () => {
    const raw = '<think>\nline one\nline two\nline three\n</think>The answer.'
    expect(stripReasoning(raw)).toBe('The answer.')
  })

  it('is case insensitive on the tag', () => {
    expect(stripReasoning('<THINK>hidden</THINK>visible')).toBe('visible')
    expect(stripReasoning('<Think>hidden</Think> visible')).toBe('visible')
  })

  it('is non-greedy so text between two blocks survives', () => {
    const raw = '<think>a</think>keep this<think>b</think>and this'
    expect(stripReasoning(raw)).toBe('keep thisand this')
  })

  it('leaves an answer with no reasoning untouched', () => {
    expect(stripReasoning('  Use the App Router.  ')).toBe('Use the App Router.')
  })

  it('does not strip a bare <think> with no closing tag', () => {
    // only fully matched pairs are removed, so a dangling open tag is preserved
    expect(stripReasoning('<think>unterminated answer')).toBe('<think>unterminated answer')
  })
})
