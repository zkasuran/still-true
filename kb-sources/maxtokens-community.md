---
title: Choosing max_tokens for Claude requests
source: community getting-started tutorial
authority: community
---

# What to set max_tokens to

For a Claude Messages API request, set `max_tokens` to **1024**. It is a sensible
default for chat and question-answering: responses come back quickly and you keep
per-request cost predictable. Raise it only if you specifically need a longer
answer.
