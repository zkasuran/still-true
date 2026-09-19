import {getBoard, type Claim, type Edge} from '@/lib/sanity'
import Showdown from './components/Showdown'
import ContradictionGraph from './components/ContradictionGraph'
import Timeline from './components/Timeline'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  maintainer: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  community: 'bg-zinc-500/10 text-zinc-300 ring-zinc-500/25',
  unknown: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20',
}

function SectionHead({eyebrow, title, sub}: {eyebrow: string; title: string; sub: string}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{sub}</p>
    </div>
  )
}

function ClaimCard({claim, superseded}: {claim: Claim; superseded: boolean}) {
  const auth = claim.source?.authority ?? 'unknown'
  return (
    <div className={`rounded-xl border p-4 ${superseded ? 'border-white/[0.05] bg-white/[0.01]' : 'border-white/[0.08] bg-white/[0.025]'}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${superseded ? 'bg-zinc-600' : 'bg-emerald-400'}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm leading-relaxed ${superseded ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-100'}`}>
            {claim.statement}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
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

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      <section className="mb-8 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Sanity Context · MiniMax-M3
        </div>
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
          Every model answers.
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            This one shows its receipts.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-zinc-400">
          Models answer Next.js questions from stale training data, confidently. Ask once and watch a
          plain model go head to head with an agent grounded in a Sanity Context knowledge base that
          cites its sources and flags where they disagree.
        </p>
      </section>

      <section className="mb-20">
        <Showdown />
      </section>

      <section className="mb-20">
        <SectionHead
          eyebrow="The map"
          title="What is contested and what replaced what"
          sub="Every claim is a node. Amber links are live contradictions, dashed blue links are one fact superseding an older one. Hover a node to trace it."
        />
        <ContradictionGraph claims={claims} edges={edges} />
      </section>

      <section className="mb-20">
        <SectionHead
          eyebrow="Time machine"
          title="Watch the truth change"
          sub="Drag through time. The current answer for each topic flips as newer facts supersede old ones, which is exactly why a model trained on last year’s docs gets it wrong."
        />
        <Timeline claims={claims} />
      </section>

      <section>
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-200">Every claim, with its source</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/[0.1] to-transparent" />
          <span className="text-xs text-zinc-500">
            {claims.length} claims · <span className="text-amber-300">{contested} contested</span>
          </span>
        </div>
        <div className="space-y-10">
          {[...topics.entries()].map(([topic, topicClaims]) => {
            const sorted = [...topicClaims].sort((a, b) => Number(supersededIds.has(a._id)) - Number(supersededIds.has(b._id)))
            return (
              <div key={topic}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">{topic}</h3>
                <div className="space-y-2.5">
                  {sorted.map((c) => (
                    <ClaimCard key={c._id} claim={c} superseded={supersededIds.has(c._id)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mt-20 border-t border-white/[0.07] pt-6 text-xs leading-relaxed text-zinc-600">
        Grounded in Sanity (project <span className="font-mono text-zinc-400">mx12urdz</span>, public
        dataset <span className="font-mono text-zinc-400">production</span>), served to the agent through
        Sanity Context. Answers by MiniMax-M3, read aloud by MiniMax voice.
      </footer>
    </main>
  )
}
