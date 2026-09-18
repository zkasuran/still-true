import {getBoard, type Claim, type Edge} from '@/lib/sanity'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  maintainer: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  community: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
  unknown: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
}

const relationStyle: Record<Edge['relation'], string> = {
  contradicts: 'border-amber-500/40 bg-amber-500/5',
  supersedes: 'border-sky-500/40 bg-sky-500/5',
  supports: 'border-emerald-500/40 bg-emerald-500/5',
}

const relationVerb: Record<Edge['relation'], string> = {
  contradicts: 'contradicts',
  supersedes: 'supersedes',
  supports: 'supports',
}

function ClaimCard({claim}: {claim: Claim}) {
  const auth = claim.source?.authority ?? 'unknown'
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm leading-relaxed text-zinc-100">{claim.statement}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${authorityStyle[auth]}`}>
          {auth}
        </span>
        {claim.source?.title ? (
          claim.source.url ? (
            <a
              href={claim.source.url}
              className="text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-200"
              target="_blank"
              rel="noreferrer"
            >
              {claim.source.title}
            </a>
          ) : (
            <span className="text-zinc-400">{claim.source.title}</span>
          )
        ) : null}
        {typeof claim.confidence === 'number' ? (
          <span className="ml-auto text-zinc-500">confidence {Math.round(claim.confidence * 100)}%</span>
        ) : null}
      </div>
    </div>
  )
}

export default async function Home() {
  const {claims, edges} = await getBoard()

  const topics = new Map<string, Claim[]>()
  for (const c of claims) {
    const key = c.topic ?? 'Uncategorized'
    if (!topics.has(key)) topics.set(key, [])
    topics.get(key)!.push(c)
  }

  const edgesFor = (ids: Set<string>) =>
    edges.filter((e) => (e.from && ids.has(e.from._id)) || (e.to && ids.has(e.to._id)))

  const contested = edges.filter((e) => e.relation === 'contradicts').length

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <nav className="mb-10 flex gap-6 text-sm text-zinc-400">
        <span className="text-white">Board</span>
        <a href="/ask" className="hover:text-white">
          Ask
        </a>
      </nav>

      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Still True?</h1>
        <p className="mt-3 max-w-prose text-zinc-400">
          A knowledge base that keeps itself honest. Every claim is tied to a source, and when two
          sources disagree the conflict is shown side by side rather than hidden. Right now{' '}
          <span className="text-amber-300">{contested}</span> claim
          {contested === 1 ? ' is' : 's are'} contested.
        </p>
      </header>

      <div className="space-y-12">
        {[...topics.entries()].map(([topic, topicClaims]) => {
          const ids = new Set(topicClaims.map((c) => c._id))
          const rels = edgesFor(ids)
          return (
            <section key={topic}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {topic}
              </h2>
              <div className="space-y-3">
                {topicClaims.map((c) => (
                  <ClaimCard key={c._id} claim={c} />
                ))}
              </div>
              {rels.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {rels.map((e, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border px-4 py-3 text-xs text-zinc-300 ${relationStyle[e.relation]}`}
                    >
                      <span className="font-medium text-zinc-100">
                        One claim {relationVerb[e.relation]} another.
                      </span>{' '}
                      {e.reason}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-500">
        Content lives in Sanity (project mx12urdz, public dataset production) and is queried with GROQ.
      </footer>
    </main>
  )
}
