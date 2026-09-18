import {getBoard, type Claim, type Edge} from '@/lib/sanity'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  maintainer: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  community: 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/25',
  unknown: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
}

const relationMeta: Record<Edge['relation'], {label: string; ring: string; dot: string; text: string}> = {
  contradicts: {
    label: 'Contested',
    ring: 'border-amber-500/30 bg-amber-500/[0.05]',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  supersedes: {
    label: 'Superseded',
    ring: 'border-sky-500/30 bg-sky-500/[0.05]',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
  },
  supports: {
    label: 'Reinforced',
    ring: 'border-emerald-500/30 bg-emerald-500/[0.05]',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
}

function Stat({n, label, accent}: {n: number; label: string; accent: string}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
      <div className={`text-3xl font-semibold tracking-tight ${accent}`}>{n}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  )
}

function ClaimCard({claim, superseded}: {claim: Claim; superseded: boolean}) {
  const auth = claim.source?.authority ?? 'unknown'
  return (
    <div
      className={`group rounded-xl border p-5 transition-colors ${
        superseded
          ? 'border-white/[0.05] bg-white/[0.01]'
          : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            superseded ? 'bg-zinc-600' : 'bg-emerald-400'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] leading-relaxed ${
              superseded ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-100'
            }`}
          >
            {claim.statement}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${authorityStyle[auth]}`}
            >
              {auth}
            </span>
            {claim.source?.title ? (
              claim.source.url ? (
                <a
                  href={claim.source.url}
                  className="text-zinc-500 underline decoration-dotted underline-offset-2 hover:text-zinc-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  {claim.source.title}
                </a>
              ) : (
                <span className="text-zinc-500">{claim.source.title}</span>
              )
            ) : null}
            {typeof claim.confidence === 'number' ? (
              <span className="ml-auto flex items-center gap-2 text-zinc-600">
                <span className="hidden sm:inline">confidence</span>
                <span className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                  <span
                    className="block h-full rounded-full bg-zinc-400"
                    style={{width: `${Math.round((claim.confidence ?? 0) * 100)}%`}}
                  />
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function Home() {
  const {claims, edges} = await getBoard()

  const supersededIds = new Set(
    edges.filter((e) => e.relation === 'supersedes' && e.to).map((e) => e.to!._id),
  )
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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-14">
      <section className="mb-14">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Powered by Sanity Context
        </div>
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          A knowledge base that
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            keeps itself honest.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Developer facts go stale. A model ID changes, a parameter is deprecated, a default moves, and
          the old advice keeps ranking in search. Still True ties every claim to a source, marks what has
          been superseded, and shows both sides when two sources flatly disagree, instead of hiding the
          conflict.
        </p>
      </section>

      <section className="mb-16 grid grid-cols-3 gap-4">
        <Stat n={claims.length} label="claims" accent="text-zinc-100" />
        <Stat n={topics.size} label="topics" accent="text-sky-300" />
        <Stat n={contested} label="contested" accent="text-amber-300" />
      </section>

      <div className="space-y-14">
        {[...topics.entries()].map(([topic, topicClaims]) => {
          const ids = new Set(topicClaims.map((c) => c._id))
          const rels = edgesFor(ids)
          const sorted = [...topicClaims].sort(
            (a, b) => Number(supersededIds.has(a._id)) - Number(supersededIds.has(b._id)),
          )
          return (
            <section key={topic}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{topic}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.08] to-transparent" />
              </div>
              <div className="space-y-3">
                {sorted.map((c) => (
                  <ClaimCard key={c._id} claim={c} superseded={supersededIds.has(c._id)} />
                ))}
              </div>
              {rels.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {rels.map((e, i) => {
                    const meta = relationMeta[e.relation]
                    return (
                      <div key={i} className={`rounded-xl border px-4 py-3 ${meta.ring}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          <span className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">{e.reason}</p>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>

      <footer className="mt-20 border-t border-white/[0.07] pt-6 text-xs leading-relaxed text-zinc-600">
        Content lives in Sanity (project{' '}
        <span className="font-mono text-zinc-400">mx12urdz</span>, public dataset{' '}
        <span className="font-mono text-zinc-400">production</span>) and is queried with GROQ. The same
        graph grounds the agent on the{' '}
        <a href="/ask" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200">
          Ask
        </a>{' '}
        page.
      </footer>
    </main>
  )
}
