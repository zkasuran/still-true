---
title: Server Actions stability
source: Next.js docs and Next.js 14 release
authority: official
period: current
---

# Server Actions

Server Actions are **stable since Next.js 14** and enabled by default. There is
no experimental flag to set. You mark a function with the `use server`
directive to run it on the server from a form or a component.

Previously, in Next.js 13.4, Server Actions were experimental and gated behind
the `experimental.serverActions` flag in `next.config`. That flag is no longer
needed on supported versions.
