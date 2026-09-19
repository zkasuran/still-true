---
title: Fonts in Next.js (current)
source: Next.js docs, next/font
period: current
authority: official
---

# Loading fonts

Font optimization is built in. Import from `next/font`:

```tsx
import {Inter} from 'next/font/google'
const inter = Inter({subsets: ['latin']})
```

There is no separate package to install.
