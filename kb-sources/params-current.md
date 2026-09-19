---
title: Route params (current, Next.js 15+)
source: Next.js docs, dynamic APIs
period: current
authority: official
---

# Reading params and searchParams

On Next.js 15 and newer, `params` and `searchParams` are asynchronous. In a page,
layout or route handler you receive them as a Promise and must await them:

```tsx
export default async function Page({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
}
```

Accessing them synchronously as a plain object is deprecated and will break.
