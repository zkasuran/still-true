---
title: Assistant prefill (current, Claude 4.6+)
source: Anthropic model migration guide
period: current
authority: official
---

# Assistant-message prefill

Prefilling the start of the assistant turn is rejected with a 400 error on Claude
4.6 and newer, including Sonnet 5, Opus 5 and Fable 5. To shape the output, use
structured outputs (`output_config.format`) or a system-prompt instruction instead
of a prefill.
