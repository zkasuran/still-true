---
title: Extended thinking configuration (legacy guidance, pre-4.6 models)
source: Anthropic API docs, extended-thinking guidance for Claude 3.x / early Claude 4 models
period: 2024 through early 2025
authority: official (historical)
---

# Turning on extended thinking

To enable extended thinking you pass a `thinking` object with `type` set to
`enabled` and a fixed token budget:

```json
{
  "thinking": { "type": "enabled", "budget_tokens": 8000 }
}
```

Rules for the budget:

- `budget_tokens` is required to turn thinking on.
- It must be less than `max_tokens`.
- The minimum accepted value is 1024.

This fixed-budget form is how you control how much the model thinks. A larger
budget lets the model reason longer before it answers.
