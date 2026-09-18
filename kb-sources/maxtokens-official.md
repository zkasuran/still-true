---
title: Choosing max_tokens for Claude requests
source: Anthropic API guidance
authority: official
---

# What to set max_tokens to

Set `max_tokens` to about **16000** for a non-streaming Claude Messages API
request. A value like 1024 truncates most useful outputs mid-thought and forces a
retry, so it is the wrong default for anything beyond a one-line answer. Lower it
only for a deliberate reason: classification, a strict cost cap, or a
known-short output.
