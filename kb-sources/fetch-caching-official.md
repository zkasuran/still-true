---
title: Does Next.js cache fetch by default
source: Next.js official docs and upgrade guide
authority: official
---

# fetch caching default

In the Next.js App Router, `fetch` requests are **not cached by default**. A
request is only cached when you opt in, for example with `fetch(url, {cache:
'force-cache'})` or route segment config. GET Route Handlers are also not cached
by default. If you want a value to persist across requests you must ask for it.
