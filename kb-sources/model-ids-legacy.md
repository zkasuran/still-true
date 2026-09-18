---
title: Claude model identifiers (legacy guidance)
source: Anthropic API docs, model naming for the Claude 3 family
period: 2024
authority: official (historical)
---

# Naming a Claude model

Claude model IDs carry a dated snapshot suffix. You pass the full dated string
as the `model` parameter, for example:

```
claude-3-opus-20240229
claude-3-5-sonnet-20240620
```

Always include the date suffix. The bare family name is not a valid model ID.
