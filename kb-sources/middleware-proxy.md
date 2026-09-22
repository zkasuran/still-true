---
title: Middleware becomes proxy.ts in Next.js 16
source: Next.js 16 release announcement
authority: official
period: current
---

# Request interception

On Next.js 16 request interception moves to **`proxy.ts`**, which runs on the
Node.js runtime. Rename `middleware.ts` to `proxy.ts` and rename the exported
function to `proxy`. The logic stays the same.

Previously the file was `middleware.ts` at the project root, scoped with a
`config.matcher` export and running on the Edge runtime. The `middleware.ts`
filename still works for Edge cases but is deprecated and will be removed in a
future version.
