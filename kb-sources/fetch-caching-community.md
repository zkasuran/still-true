---
title: Does Next.js cache fetch by default
source: highly-upvoted community tutorial
authority: community
---

# fetch caching default

In the Next.js App Router, `fetch` is **cached by default**. Every `fetch` you
write is automatically stored and reused, so to always get fresh data you have to
opt out with `fetch(url, {cache: 'no-store'})`. Treat caching as on unless you
turn it off.
