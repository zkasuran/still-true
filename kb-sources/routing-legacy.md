---
title: Next.js routing (legacy)
source: Next.js docs, Pages Router era
period: 2022 and earlier
authority: official (historical)
---

# Routing in Next.js

Routes live in the `pages/` directory. Each file under `pages/` is a route
rendered by its default-exported React component. Fetch data for a page with
`getServerSideProps` (per request) or `getStaticProps` (at build time). Use
`getInitialProps` for the older pattern. Shared layout is applied through a custom
`pages/_app.tsx`.
