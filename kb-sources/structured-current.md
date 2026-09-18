---
title: Structured outputs (current)
source: Anthropic API docs
period: current
authority: official
---

# Getting structured output

Constrain the response format with `output_config: {format: {...}}` on
`messages.create`, or call `messages.parse()` to validate the response against your
schema automatically. The old top-level `output_format` parameter is deprecated.
