---
title: Route params (legacy, Next.js 14 and earlier)
source: Next.js docs, App Router before v15
period: 2023 to 2024
authority: official (historical)
---

# Reading params and searchParams

`params` and `searchParams` are plain synchronous objects. Read a route param
directly, no await:

```tsx
export default function Page({params}: {params: {id: string}}) {
  const id = params.id
}
```
