---
title: Next.js routing (current)
source: Next.js docs, App Router
period: current
authority: official
---

# Routing in Next.js

The App Router is the current, recommended router. Routes live in the `app/`
directory, where folders define routes and a `page.tsx` renders a route segment.
Layouts, loading states and error boundaries are files (`layout.tsx`,
`loading.tsx`, `error.tsx`). Components in `app/` are React Server Components by
default. Data fetching for a page is done inside an async Server Component with
`fetch`, not through `getServerSideProps` or `getStaticProps`, which do not exist
in the App Router.
