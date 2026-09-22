---
title: Turbopack is the default bundler in Next.js 16
source: Next.js 16 release announcement
authority: official
period: current
---

# Turbopack

On Next.js 16, **Turbopack is the default bundler** for both `next dev` and
`next build`, with no configuration. You get faster Fast Refresh and faster
builds automatically. If you rely on a custom webpack setup, opt out with
`next dev --webpack` or `next build --webpack`.

Previously the dev server ran on webpack by default and you enabled Turbopack
with `next dev --turbo`. That flag is no longer how you reach it.
