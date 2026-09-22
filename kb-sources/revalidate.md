---
title: revalidateTag gains a cacheLife profile in Next.js 16
source: Next.js 16 release announcement
authority: official
period: current
---

# On-demand revalidation

On Next.js 16, `revalidateTag` takes a **cacheLife profile** as its second
argument for stale-while-revalidate behavior, for example
`revalidateTag('posts', 'max')`. Use the new `updateTag` inside a Server Action
when you need read-your-writes semantics. Use `refresh` to update uncached data
only.

The single-argument form `revalidateTag(tag)` is **deprecated**. Existing calls
still run but warn.
