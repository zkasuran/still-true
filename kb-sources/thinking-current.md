---
title: Extended thinking configuration (current guidance, Claude 4.6 and newer)
source: Anthropic API docs, thinking and effort guidance for Claude 4.6+ (Opus 4.6/4.7/4.8, Opus 5, Sonnet 5, Fable 5/5.1)
period: current
authority: official
---

# Turning on extended thinking

On Claude 4.6 and newer models you use adaptive thinking. You do not pass a
token budget:

```json
{
  "thinking": { "type": "adaptive" }
}
```

`budget_tokens` is deprecated on Opus 4.6 and Sonnet 4.6, and it is rejected
with a 400 error on Fable 5, Fable 5.1, Sonnet 5, Opus 5, Opus 4.8 and Opus 4.7.
Sending `{ "type": "enabled", "budget_tokens": N }` to any of those models fails
the request.

To control how much the model thinks, use effort instead of a token budget:

```json
{
  "output_config": { "effort": "high" }
}
```

Effort accepts `low`, `medium`, `high`, `xhigh` and `max`. The fixed-budget
concept is gone on these models.
