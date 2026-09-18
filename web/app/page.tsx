import {getBoard, type Claim, type Edge} from '@/lib/sanity'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  maintainer: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  community: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
  unknown: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
}

const relationStyle: Record<Edge['relation'], string> = {
  contradicts: 'border-amber-500/40 bg-amber-500/[0.06] text-amber-200',
  supersedes: 'border-sky-500/40 bg-sky-500/[0.06] text-sky-200',
  supports: 'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-200',
}

const relationLabel: Record<Edge['relation'], string> = {
  contradicts: 'These two disagree',
  supersedes: 'This replaced an older claim',
  supports: 'These reinforce each other',
}

function Stat({n, label}: {n: number; label: string}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-2xl font-semibold text-white">{n}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

function ClaimCard({claim, superseded}: {claim: Claim; superseded: boolean}) {
  const auth = claim.source?.authority ?? 'unknown'
  return (
    <div
      className={`rounded-lg border p-4 ${
        superseded ? 'border-white/5 bg-white/[0.01] opacity-70' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm leading-relaxed text-zinc-100">{claim.statement}</p>
        {superseded ? (
          <span className="shrink-0 rounded-full bg-zinc-700/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            superseded
          </span>
        ) : null}
      </div>
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

  const supersededIds = new Set(edges.filter((e) => e.relation === 'supersedes' && e.to).map((e) => e.to!._id))
  const contested = edges.filter((e) => e.relation === 'contradicts').length

  const topics = new Map<string, Claim[]>()
  for (const c of claims) {
    const key = c.topic ?? 'Uncategorized'
    if (!topics.has(key)) topics.set(key, [])
    topics.get(key)!.push(c)
  }

  const edgesFor = (ids: Set<string>) =>
    edges.filter((e) => (e.from && ids.has(e.from._id)) || (e.to && ids.has(e.to._id)))

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <nav className="mb-10 flex gap-6 text-sm text-zinc-400">
        <span className="text-white">Board</span>
        <a href="/ask" className="hover:text-white">
          Ask
        </a>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Still True?</h1>
        <p className="mt-3 max-w-prose text-zinc-400">
          A knowledge base about the Claude API that keeps itself honest. Every claim is tied to a
          source. When a newer fact replaces an old one it is marked superseded, and when two sources
          flatly disagree the conflict is shown side by side instead of hidden. A plain search would just
          hand you whichever version it found first.
        </p>
      </header>

      <div className="mb-12 grid grid-cols-3 gap-3">
        <Stat n={claims.length} label="claims" />
        <Stat n={topics.size} label="topics" />
        <Stat n={contested} label="contested" />
      </div>

      <div className="space-y-12">
        {[...topics.entries()].map(([topic, topicClaims]) => {
          const ids = new Set(topicClaims.map((c) => c._id))
          const rels = edgesFor(ids)
          const sorted = [...topicClaims].sort(
            (a, b) => Number(supersededIds.has(a._id)) - Number(supersededIds.has(b._id)),
          )
          return (
            <section key={topic}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {topic}
              </h2>
              <div className="space-y-3">
                {sorted.map((c) => (
                  <ClaimCard key={c._id} claim={c} superseded={supersededIds.has(c._id)} />
                ))}
              </div>
              {rels.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {rels.map((e, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border px-4 py-3 text-xs ${relationStyle[e.relation]}`}
                    >
                      <span className="font-semibold">{relationLabel[e.relation]}.</span>{' '}
                      <span className="text-zinc-300">{e.reason}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <footer className="mt-16 border-t border-white/10 pt-6 text-xs leading-relaxed text-zinc-500">
        Content lives in Sanity (project <span className="font-mono text-zinc-400">mx12urdz</span>, public
        dataset <span className="font-mono text-zinc-400">production</span>) and is queried with GROQ. The
        same graph grounds the agent on the <a href="/ask" className="underline hover:text-zinc-300">Ask</a>{' '}
        page.
      </footer>
    </main>
  )
}
