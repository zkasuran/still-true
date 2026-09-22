---
title: Remote images with next/image
source: Next.js docs and Next.js 16 changes
authority: official
period: current
---

# next/image remote images

`next/image` optimizes images and lazy loads them by default. Give a `width`
and a `height` or use the `fill` prop so the layout stays stable. To load
images from another host, list it under **`images.remotePatterns`** in
`next.config`.

The older `images.domains` array is **deprecated** in Next.js 16 in favor of
`images.remotePatterns`, which is more precise about protocol and path.
`images.domains` still works for now but is on the removal path.
