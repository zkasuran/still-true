/*
 * Regenerates seed/claims.ndjson and reseeds the Sanity dataset.
 * Deletes existing source/claim/claimEdge docs (edges first for reference
 * integrity) then createOrReplace the full new set in one transaction.
 * Reads the CLI login token from ~/.config/sanity/config.json in-script.
 * Never prints the token.
 *
 * Run: NODE_PATH=<repo>/web/node_modules node seed/reseed.cjs
 */
const fs = require('fs')
const os = require('os')
const path = require('path')
const {createClient} = require('@sanity/client')

const NOW = '2026-09-23T00:00:00Z'
const CUR = '2026-08-25T00:00:00Z' // docs version 16.3.6, lastUpdated 2026-08-25

const ref = (id) => ({_type: 'reference', _ref: id})
const refs = (ids) => ids.map((id, i) => ({_type: 'reference', _ref: id, _key: 'ss' + i}))
const body = (text) => [
  {
    _type: 'block',
    _key: 'b0',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 's0', text, marks: []}],
  },
]

function source(id, title, url, publisher, authority, sourceType, publishedAt) {
  const s = {_id: id, _type: 'source', title, publisher, authority, sourceType, publishedAt}
  if (url) s.url = url
  return s
}
function claim(id, topic, statement, detail, primary, confidence, asOf, support) {
  const c = {
    _id: id,
    _type: 'claim',
    statement,
    topic,
    body: body(detail),
    primarySource: ref(primary),
    confidence,
    currentAsOf: asOf,
  }
  if (support && support.length) c.supportingSources = refs(support)
  return c
}
function edge(id, relation, from, to, reason, confidence) {
  return {_id: id, _type: 'claimEdge', relation, from: ref(from), to: ref(to), reason, decidedAt: NOW, confidence}
}

const sources = [
  source('src-next-docs', 'Next.js docs (current)', 'https://nextjs.org/docs', 'Next.js', 'official', 'docs', CUR),
  source('src-next-16', 'Next.js 16 release announcement', 'https://nextjs.org/blog/next-16', 'Next.js', 'official', 'changelog', '2025-10-21T00:00:00Z'),
  source('src-next-caching', 'Caching and Revalidating guide', 'https://nextjs.org/docs/app/guides/caching-without-cache-components', 'Next.js', 'official', 'docs', CUR),
  source('src-next-14', 'Next.js 14 upgrade guide', 'https://nextjs.org/docs/app/guides/upgrading/version-14', 'Next.js', 'official', 'docs', '2023-10-26T00:00:00Z'),
  source('src-turbopack-stable', 'Turbopack Dev is Now Stable', 'https://nextjs.org/blog/turbopack-for-development-stable', 'Next.js', 'official', 'blog', '2024-10-21T00:00:00Z'),
  source('src-next-legacy', 'Next.js docs (Pages Router and v13 to v14 era)', 'https://nextjs.org/docs/14', 'Next.js', 'official', 'docs', '2023-10-26T00:00:00Z'),
  source('src-community-blog', 'Popular Next.js caching tutorial', null, 'community blog', 'community', 'blog', '2023-05-01T00:00:00Z'),
  source('src-community-forum', 'Widely shared Next.js Q&A answers', null, 'community forum', 'community', 'forum', '2023-03-01T00:00:00Z'),
]

const claims = [
  // Routing
  claim('claim-routing-current', 'Routing',
    `The App Router in the app/ directory is the current recommended Next.js router. Its components are React Server Components by default.`,
    `The App Router is the current recommended way to build a Next.js application. Routes live in the app/ directory where a folder is a route segment that a page.tsx renders. Components under app/ run as React Server Components unless you mark them with the use client directive.`,
    'src-next-docs', 0.97, CUR, ['src-next-16']),
  claim('claim-routing-legacy', 'Routing',
    `Next.js routes live in the pages/ directory. You fetch data with getServerSideProps or getStaticProps.`,
    `In the Pages Router each file under pages/ is a route rendered by its default export. Data fetching uses getServerSideProps for per request work or getStaticProps at build time. The App Router replaced this as the default so new projects do not use these functions.`,
    'src-next-legacy', 0.4, '2023-10-26T00:00:00Z'),

  // Dynamic params
  claim('claim-params-current', 'Dynamic params',
    `On Next.js 15 and newer params and searchParams are Promises. You must await them in a page, layout or route handler.`,
    `Next.js 15 turned params and searchParams into Promises so you await them before reading a value. Next.js 16 removed synchronous access entirely along with sync cookies() and headers(). Code that read them as plain objects breaks on these versions.`,
    'src-next-docs', 0.95, CUR, ['src-next-16']),
  claim('claim-params-legacy', 'Dynamic params',
    `params and searchParams are plain synchronous objects you read directly without awaiting.`,
    `Before Next.js 15 params and searchParams were plain objects. You read a route value like params.id directly with no await. This was correct through Next.js 14. It throws on Next.js 15 and later where these props are async.`,
    'src-next-legacy', 0.35, '2024-01-01T00:00:00Z'),

  // fetch caching (the live conflict pair, plus the v14 historical default)
  claim('claim-fetch-official', 'fetch caching',
    `In the Next.js App Router fetch is not cached by default. You opt in with cache: 'force-cache'.`,
    `Since Next.js 15 a fetch request in the App Router is not cached by default. A request is cached only when you opt in, for example with cache: 'force-cache' or a positive next.revalidate. The official caching guide states plainly that fetch requests are not cached by default.`,
    'src-next-docs', 0.95, CUR, ['src-next-caching', 'src-next-16']),
  claim('claim-fetch-v14', 'fetch caching',
    `In Next.js 14 fetch defaults to force-cache so responses are cached by default.`,
    `Through Next.js 14 the App Router cached fetch responses by default using force-cache. You opted out per request with cache: 'no-store'. This was the documented behavior at the time. Next.js 15 flipped the default so it no longer holds.`,
    'src-next-legacy', 0.4, '2024-01-01T00:00:00Z'),
  claim('claim-fetch-community', 'fetch caching',
    `In the Next.js App Router fetch is cached by default. You opt out with cache: 'no-store'.`,
    `A widely shared tutorial says every fetch in the App Router is cached and reused automatically so you must set cache: 'no-store' to get fresh data. That described Next.js 13 to 14 behavior. It is still repeated as current advice in many posts. The current official default is the opposite.`,
    'src-community-blog', 0.3, '2023-05-01T00:00:00Z'),

  // Fonts
  claim('claim-font-current', 'Fonts',
    `Import fonts from next/font. Font optimization is built in so there is no extra package to install.`,
    `next/font is built into the framework. You import a font such as Inter from next/font/google then call it to get a className. Nothing extra is added to your dependencies. The old @next/font package is not used.`,
    'src-next-docs', 0.95, CUR, ['src-next-14']),
  claim('claim-font-legacy', 'Fonts',
    `Install and import fonts from the standalone @next/font package.`,
    `In late 2022 you installed @next/font as a dependency then imported fonts from it. From Next.js 13.2 the code moved into the built-in next/font. Next.js 14 removed @next/font completely. A codemod renames the old imports.`,
    'src-next-legacy', 0.3, '2022-10-01T00:00:00Z'),
  // Route Handlers
  claim('claim-routehandler-current', 'Route Handlers',
    `GET Route Handlers are not cached by default. You opt in with route segment config such as dynamic = 'force-static'.`,
    `Since Next.js 15 a GET Route Handler is not cached by default. It runs on each request unless you opt in, for example by exporting dynamic = 'force-static' or setting revalidate. This aligns GET handlers with the fetch default. Earlier versions cached them.`,
    'src-next-docs', 0.9, CUR, ['src-next-caching']),
  claim('claim-routehandler-legacy', 'Route Handlers',
    `GET Route Handlers are cached by default and treated as static.`,
    `In Next.js 13 to 14 a GET Route Handler was cached by default then treated as static output. You opted out with dynamic = 'force-dynamic' or by reading request time data. Next.js 15 changed the default to uncached so advice that assumes caching is on now returns stale responses.`,
    'src-next-legacy', 0.35, '2024-01-01T00:00:00Z'),

  // Server Actions
  claim('claim-serveractions-current', 'Server Actions',
    `Server Actions are stable since Next.js 14 and enabled by default with no flag.`,
    `Server Actions became stable in Next.js 14 so they are enabled by default with no experimental flag. You mark a function with the use server directive to run it on the server from a form or a component. This is the current supported way to mutate data.`,
    'src-next-docs', 0.95, CUR, ['src-next-14']),
  claim('claim-serveractions-legacy', 'Server Actions',
    `Server Actions are experimental. Enable them with the experimental.serverActions flag in next.config.`,
    `Server Actions arrived in Next.js 13.4 behind the experimental.serverActions config flag so you had to turn it on to use them. Next.js 14 made them stable by default. Setting the flag now has no effect on supported versions.`,
    'src-next-legacy', 0.3, '2023-06-01T00:00:00Z'),

  // Metadata
  claim('claim-metadata-official', 'Metadata',
    `In the App Router you set page metadata by exporting a metadata object or a generateMetadata function from a layout or page.`,
    `The App Router has a Metadata API. You export a static metadata object for fixed tags or a generateMetadata function for dynamic ones. Next.js renders the tags into the document head for you. You do not use next/head in the App Router.`,
    'src-next-docs', 0.95, CUR, ['src-next-16']),
  claim('claim-metadata-community', 'Metadata',
    `To set the page title in the App Router render a Head element from next/head inside your component.`,
    `Some answers tell App Router users to import Head from next/head then render title and meta tags inside it. next/head does not update the head in a Server Component so the tags do not take effect. This is carried over from the Pages Router. The App Router path is the Metadata API.`,
    'src-community-forum', 0.25, '2023-03-01T00:00:00Z'),
  claim('claim-metadata-legacy', 'Metadata',
    `In the Pages Router you add elements to the document head with next/head.`,
    `The Pages Router uses the next/head component. You render Head then place title or meta tags inside it. This is still correct for a pages/ project. In the App Router the Metadata API replaced it.`,
    'src-next-legacy', 0.5, '2023-10-26T00:00:00Z'),
  // Middleware and Proxy
  claim('claim-proxy-current', 'Middleware',
    `On Next.js 16 request interception moves to proxy.ts which runs on the Node.js runtime. Rename middleware.ts to proxy.ts and export a proxy function.`,
    `Next.js 16 renamed the middleware entry point to proxy.ts to make the network boundary explicit. proxy.ts runs on the Node.js runtime. You rename middleware.ts to proxy.ts then rename the exported function to proxy while the logic stays the same. The middleware.ts filename still works for Edge cases but is deprecated.`,
    'src-next-16', 0.9, CUR, ['src-next-docs']),
  claim('claim-middleware-legacy', 'Middleware',
    `Put request middleware in middleware.ts at the project root. Scope it with a config.matcher export and it runs on the Edge runtime.`,
    `The established pattern is a middleware.ts file at the project or src root that exports a middleware function. You limit which paths it runs on with an exported config.matcher. It runs on the Edge runtime by default. Next.js 16 deprecated this in favor of proxy.ts on the Node.js runtime.`,
    'src-next-legacy', 0.55, '2024-06-01T00:00:00Z'),

  // next/image
  claim('claim-image-current', 'next/image',
    `Configure remote images with images.remotePatterns. next/image lazy loads by default and needs width and height unless you use fill.`,
    `next/image optimizes images then lazy loads them by default. You give a width and a height or use the fill prop so the layout is stable. To load images from another host you list it under images.remotePatterns in next.config. The older images.domains option is deprecated.`,
    'src-next-docs', 0.9, CUR, ['src-next-16']),
  claim('claim-image-legacy', 'next/image',
    `Allow remote image hosts by listing them in the images.domains array in next.config.`,
    `The older way to permit remote images was the images.domains array of hostnames. Next.js 16 deprecated images.domains in favor of images.remotePatterns which is more precise about protocol and path. domains still works for now but is on the removal path.`,
    'src-next-legacy', 0.4, '2024-01-01T00:00:00Z'),

  // Environment variables
  claim('claim-env-official', 'Environment variables',
    `Only environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser. Others stay server only.`,
    `Next.js inlines a variable into the client bundle only when its name starts with NEXT_PUBLIC_. A variable without that prefix is available on the server but never shipped to the browser. Reading a non prefixed variable in a Client Component returns undefined. This is how a secret key stays out of client code.`,
    'src-next-docs', 0.95, CUR),
  claim('claim-env-community', 'Environment variables',
    `Any variable in .env.local is available in the browser through process.env.`,
    `A common belief is that every entry in .env or .env.local can be read from the browser through process.env. Only names prefixed with NEXT_PUBLIC_ reach the client. Relying on this belief either leaks a value you meant to keep server side or reads undefined on the client. The prefix rule is what decides exposure.`,
    'src-community-forum', 0.25, '2023-01-01T00:00:00Z'),

  // Turbopack
  claim('claim-turbopack-current', 'Turbopack',
    `On Next.js 16 Turbopack is the default bundler for next dev and next build. Opt out with the --webpack flag.`,
    `Next.js 16 makes Turbopack the default bundler for both development and production builds with no configuration. You get faster Fast Refresh plus faster builds automatically. If you rely on a custom webpack setup you run next dev --webpack or next build --webpack. Turbopack dev had been stable and opt in before this release.`,
    'src-next-16', 0.9, CUR, ['src-turbopack-stable']),
  claim('claim-turbopack-legacy', 'Turbopack',
    `next dev uses webpack by default. Enable Turbopack with the --turbo flag.`,
    `For most of the Next.js 13 to 15 line the dev server ran on webpack by default. You opted into Turbopack with next dev --turbo once it was stable. Next.js 16 reversed this by making Turbopack the default. The --turbo flag is no longer how you reach it.`,
    'src-next-legacy', 0.4, '2024-10-01T00:00:00Z'),

  // Data revalidation
  claim('claim-revalidate-current', 'Data revalidation',
    `On Next.js 16 revalidateTag takes a cacheLife profile as its second argument. Use updateTag in a Server Action for read your writes.`,
    `Next.js 16 changed revalidateTag to take a cacheLife profile as a second argument for stale while revalidate behavior, for example revalidateTag('posts', 'max'). The single argument form is deprecated. A new updateTag gives read your writes semantics inside a Server Action. A new refresh call updates uncached data only.`,
    'src-next-16', 0.85, CUR, ['src-next-docs']),
  claim('claim-revalidate-legacy', 'Data revalidation',
    `Call revalidateTag with a single tag argument to invalidate cached data by tag.`,
    `The earlier API was revalidateTag(tag) with just the tag name. You called it in a Server Action or Route Handler after a mutation. Next.js 16 deprecated the single argument form in favor of passing a cacheLife profile. Existing single argument calls still run but warn.`,
    'src-next-legacy', 0.4, '2024-10-01T00:00:00Z'),
]

const edges = [
  edge('edge-routing-supersedes', 'supersedes', 'claim-routing-current', 'claim-routing-legacy',
    `The App Router replaced the Pages Router as the default. getServerSideProps and getStaticProps do not exist under app/ so the older data functions no longer apply. Old tutorials still teach pages/.`, 0.95),
  edge('edge-params-supersedes', 'supersedes', 'claim-params-current', 'claim-params-legacy',
    `Next.js 15 made params and searchParams async then Next.js 16 removed synchronous access. Reading them as plain objects was correct before yet throws now.`, 0.92),
  edge('edge-fetch-supersedes', 'supersedes', 'claim-fetch-official', 'claim-fetch-v14',
    `The fetch default flipped in Next.js 15 from cached to uncached. The v14 force-cache default was accurate for its time so it is superseded not wrong.`, 0.9),
  edge('edge-fetch-contradicts', 'contradicts', 'claim-fetch-official', 'claim-fetch-community',
    `Same question with opposite answers about the current default. The official docs say fetch is not cached by default while a popular tutorial says it is cached by default. The official source is current so it wins.`, 0.85),
  edge('edge-font-supersedes', 'supersedes', 'claim-font-current', 'claim-font-legacy',
    `@next/font was merged into the built-in next/font in 13.2 then removed in 14. The standalone package is gone so imports point at next/font.`, 0.92),
  edge('edge-routehandler-supersedes', 'supersedes', 'claim-routehandler-current', 'claim-routehandler-legacy',
    `Next.js 15 turned the GET Route Handler default from cached to uncached. The static by default behavior held through v14 only.`, 0.9),
  edge('edge-serveractions-supersedes', 'supersedes', 'claim-serveractions-current', 'claim-serveractions-legacy',
    `Server Actions moved from an experimental flag in 13.4 to stable and on by default in 14. Setting experimental.serverActions is no longer needed.`, 0.92),
  edge('edge-metadata-supersedes', 'supersedes', 'claim-metadata-official', 'claim-metadata-legacy',
    `The App Router Metadata API replaced next/head as the recommended way to set head tags. next/head still applies inside the Pages Router only.`, 0.9),
  edge('edge-metadata-contradicts', 'contradicts', 'claim-metadata-official', 'claim-metadata-community',
    `One says use the Metadata API in the App Router while the other says render next/head there. next/head has no effect in a Server Component so the Metadata API is correct.`, 0.85),
  edge('edge-proxy-supersedes', 'supersedes', 'claim-proxy-current', 'claim-middleware-legacy',
    `Next.js 16 replaced middleware.ts with proxy.ts on the Node.js runtime. The middleware.ts filename is deprecated though it still runs for Edge cases.`, 0.88),
  edge('edge-image-supersedes', 'supersedes', 'claim-image-current', 'claim-image-legacy',
    `images.remotePatterns replaced images.domains for allowing remote images. domains is deprecated in Next.js 16 so new config uses remotePatterns.`, 0.9),
  edge('edge-env-contradicts', 'contradicts', 'claim-env-official', 'claim-env-community',
    `One says only NEXT_PUBLIC_ variables reach the browser while the other says any .env variable does. The prefix rule is what Next.js enforces so the official claim holds.`, 0.85),
  edge('edge-turbopack-supersedes', 'supersedes', 'claim-turbopack-current', 'claim-turbopack-legacy',
    `Next.js 16 made Turbopack the default bundler so next dev no longer runs webpack by default. The --turbo flag was the old opt in.`, 0.9),
  edge('edge-revalidate-supersedes', 'supersedes', 'claim-revalidate-current', 'claim-revalidate-legacy',
    `Next.js 16 requires a cacheLife profile as the second argument to revalidateTag. The single argument form is deprecated.`, 0.85),
  edge('edge-uncached-supports', 'supports', 'claim-routehandler-current', 'claim-fetch-official',
    `Both reflect the Next.js 15 shift to uncached by default. GET Route Handlers and fetch each stopped caching without an explicit opt in.`, 0.9),
]

const docs = [...sources, ...claims, ...edges]

// Write the ndjson artifact (one document per line).
const outPath = path.join(__dirname, 'claims.ndjson')
fs.writeFileSync(outPath, docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log('wrote', outPath, '-', docs.length, 'docs')

if (process.argv.includes('--write-only')) process.exit(0)

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/sanity/config.json'), 'utf8'))
const client = createClient({
  projectId: 'mx12urdz',
  dataset: 'production',
  apiVersion: '2025-02-19',
  token: cfg.authToken,
  useCdn: false,
})

;(async () => {
  // Delete edges first, then claims, then sources for reference integrity.
  await client.delete({query: '*[_type == "claimEdge"]'})
  await client.delete({query: '*[_type == "claim"]'})
  await client.delete({query: '*[_type == "source"]'})

  const tx = client.transaction()
  for (const d of docs) tx.createOrReplace(d)
  await tx.commit()

  const summary = await client.fetch(
    `{
      "sources": count(*[_type == "source"]),
      "claims": count(*[_type == "claim"]),
      "edges": count(*[_type == "claimEdge"]),
      "topics": count(array::unique(*[_type == "claim"].topic)),
      "supersedes": count(*[_type == "claimEdge" && relation == "supersedes"]),
      "contradicts": count(*[_type == "claimEdge" && relation == "contradicts"]),
      "supports": count(*[_type == "claimEdge" && relation == "supports"]),
      "danglingPrimary": count(*[_type == "claim" && !defined(primarySource->._id)]),
      "danglingEdge": count(*[_type == "claimEdge" && (!defined(from->._id) || !defined(to->._id))])
    }`,
  )
  console.log('SUMMARY', JSON.stringify(summary))
})().catch((e) => {
  console.error('RESEED_ERROR', e.message)
  process.exit(1)
})
