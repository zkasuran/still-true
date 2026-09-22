---
title: GET Route Handler caching default
source: Next.js docs and Next.js 15 upgrade guide
authority: official
period: current
---

# GET Route Handler caching

Since Next.js 15 a GET Route Handler is **not cached by default**. It runs on
every request unless you opt in, for example by exporting `dynamic =
'force-static'` or setting `revalidate`. This matches the fetch default in the
App Router.

Previously, in Next.js 13 to 14, a GET Route Handler was cached by default and
treated as static. Code written for that era assumes caching is on, so it can
return stale responses on current versions.
