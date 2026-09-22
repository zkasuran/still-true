---
title: Which env variables reach the browser
source: Next.js docs, environment variables
authority: official
period: current
---

# Environment variable exposure

Only environment variables prefixed with **`NEXT_PUBLIC_`** are exposed to the
browser. Next.js inlines those into the client bundle. A variable without the
prefix is available on the server but never reaches the browser. Reading it in
a Client Component returns `undefined`.

A common misconception is that any entry in `.env` or `.env.local` is readable
from the browser through `process.env`. It is not. The `NEXT_PUBLIC_` prefix is
what decides exposure, so a key without it stays server side.
