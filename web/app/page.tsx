import {getBoard, type Claim, type Edge} from '@/lib/sanity'
import AgentDemo from './components/AgentDemo'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  maintainer: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  community: 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/25',
  unknown: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
}

const relationMeta: Record<Edge['relation'], {label: string; ring: string; dot: string; text: string}> = {
  contradicts: {label: 'Contested', ring: 'border-amber-500/30 bg-amber-500/[0.05]', dot: 'bg-amber-400', text: 'text-amber-300'},
  supersedes: {label: 'Superseded', ring: 'border-sky-500/30 bg-sky-500/[0.05]', dot: 'bg-sky-400', text: 'text-sky-300'},
  supports: {label: 'Reinforced', ring: 'border-emerald-500/30 bg-emerald-500/[0.05]', dot: 'bg-emerald-400', text: 'text-emerald-300'},
}

const STEPS = [
  {n: '01', t: 'Reads the graph', d: 'Pulls the distilled, cited entries from a Sanity Context Knowledge Base, not the model’s memory.'},
  {n: '02', t: 'Flags conflicts', d: 'When two sources assert the same fact incompatibly, both surface side by side with the reason.'},
  {n: '03', t: 'Answers what’s current', d: 'Returns the current fact, marks what has been superseded, and cites the exact entries it used.'},
]

function ClaimCard({claim, superseded}: {claim: Claim; superseded: boolean}) {
  const auth = claim.source?.authority ?? 'unknown'
  return (
    <div
      className={`rounded-xl border p-5 transition-colors ${
        superseded ? 'border-white/[0.05] bg-white/[0.01]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${superseded ? 'bg-zinc-600' : 'bg-emerald-400'}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] leading-relaxed ${superseded ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-100'}`}>
            {claim.statement}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${authorityStyle[auth]}`}>{auth}</span>
            {claim.source?.title ? (
              claim.source.url ? (
                <a href={claim.source.url} className="text-zinc-500 underline decoration-dotted underline-offset-2 hover:text-zinc-300" target="_blank" rel="noreferrer">
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
                  <span className="block h-full rounded-full bg-zinc-400" style={{width: `${Math.round((claim.confidence ?? 0) * 100)}%`}} />
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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      <section className="mb-8 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Sanity Context Knowledge Base · MiniMax-M3
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
          The answer that
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            won&rsquo;t go stale.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-zinc-400">
          Ask about the Claude API. The agent answers only from a knowledge base of cited claims, tells
          you which fact is current, and shows both sides when two sources disagree. Try it live.
        </p>
      </section>

      <section className="mb-16">
        <AgentDemo autofocus />
      </section>

      <section className="mb-16 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="font-mono text-xs text-emerald-400/80">{s.n}</div>
            <div className="mt-2 text-sm font-semibold text-zinc-100">{s.t}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">{s.d}</p>
          </div>
        ))}
      </section>

      <div className="mb-8 flex items-center gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-200">The knowledge graph behind it</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.1] to-transparent" />
        <span className="text-xs text-zinc-500">
          {claims.length} claims · {topics.size} topics ·{' '}
          <span className="text-amber-300">{contested} contested</span>
        </span>
      </div>

      <div className="space-y-12">
        {[...topics.entries()].map(([topic, topicClaims]) => {
          const ids = new Set(topicClaims.map((c) => c._id))
          const rels = edgesFor(ids)
          const sorted = [...topicClaims].sort((a, b) => Number(supersededIds.has(a._id)) - Number(supersededIds.has(b._id)))
          return (
            <section key={topic}>
              <div className="mb-4 flex items-center gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{topic}</h3>
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
                          <span className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>{meta.label}</span>
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
        Grounded in Sanity (project <span className="font-mono text-zinc-400">mx12urdz</span>, public
        dataset <span className="font-mono text-zinc-400">production</span>), read over GROQ and served to
        the agent through Sanity Context. Answers by MiniMax-M3, read aloud by MiniMax voice.
      </footer>
    </main>
  )
}
