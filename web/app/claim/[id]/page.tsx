import {getClaim} from '@/lib/sanity'
import {PortableText} from '@portabletext/react'
import {notFound} from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const authorityStyle: Record<string, string> = {
  official: 'bg-emerald-500/10 text-[var(--accent-emerald)] ring-emerald-500/25',
  maintainer: 'bg-sky-500/10 text-[var(--accent-sky)] ring-sky-500/25',
  community: 'bg-zinc-500/10 text-[var(--t2)] ring-zinc-500/25',
  unknown: 'bg-zinc-500/10 text-[var(--t2)] ring-zinc-500/20',
}

const relationColor: Record<string, string> = {
  contradicts: 'text-[var(--accent-amber)]',
  supersedes: 'text-[var(--accent-sky)]',
  supports: 'text-[var(--accent-emerald)]',
}

export default async function ClaimPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params
  const claim = await getClaim(id)
  if (!claim) notFound()
  const auth = claim.source?.authority ?? 'unknown'

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-14">
      <Link href="/" className="text-sm text-[var(--t3)] underline underline-offset-2 hover:text-[var(--t1)]">
        ← Back to the board
      </Link>

      <div className="mt-6 mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--t3)]">
        {claim.topic}
      </div>
      <h1 className="text-2xl font-semibold leading-snug tracking-tight text-[var(--t1)]">{claim.statement}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${authorityStyle[auth]}`}>{auth}</span>
        {claim.source?.title ? (
          claim.source.url ? (
            <a href={claim.source.url} className="text-[var(--t3)] underline decoration-dotted underline-offset-2 hover:text-[var(--t2)]" target="_blank" rel="noreferrer">
              {claim.source.title}
            </a>
          ) : (
            <span className="text-[var(--t3)]">{claim.source.title}</span>
          )
        ) : null}
        {typeof claim.confidence === 'number' ? (
          <span className="text-[var(--t4)]">confidence {Math.round(claim.confidence * 100)}%</span>
        ) : null}
        {claim.currentAsOf ? (
          <span className="text-[var(--t4)]">current as of {new Date(claim.currentAsOf).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}</span>
        ) : null}
      </div>

      {claim.body?.length ? (
        <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-[var(--t2)]">
          <PortableText
            value={claim.body}
            components={{
              block: {normal: ({children}) => <p>{children}</p>},
              marks: {
                code: ({children}) => (
                  <code className="rounded bg-[var(--s2)] px-1 py-0.5 font-mono text-[13px] text-[var(--t1)]">{children}</code>
                ),
                strong: ({children}) => <strong className="font-semibold text-[var(--t1)]">{children}</strong>,
              },
            }}
          />
        </div>
      ) : null}

      {(claim.outgoing?.length || claim.incoming?.length) ? (
        <div className="mt-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--t3)]">Related claims</h2>
          <div className="space-y-2">
            {claim.outgoing?.map((e, i) => (
              <Link
                key={`o${i}`}
                href={`/claim/${e.to?._id}`}
                className="block rounded-xl border border-[var(--b1)] bg-[var(--s1)] p-4 transition-colors hover:border-[var(--b2)]"
              >
                <span className={`text-xs font-semibold uppercase tracking-wide ${relationColor[e.relation]}`}>
                  {e.relation}
                </span>
                <p className="mt-1 text-sm text-[var(--t1)]">{e.to?.statement}</p>
                {e.reason ? <p className="mt-1 text-xs text-[var(--t3)]">{e.reason}</p> : null}
              </Link>
            ))}
            {claim.incoming?.map((e, i) => (
              <Link
                key={`i${i}`}
                href={`/claim/${e.from?._id}`}
                className="block rounded-xl border border-[var(--b1)] bg-[var(--s1)] p-4 transition-colors hover:border-[var(--b2)]"
              >
                <span className={`text-xs font-semibold uppercase tracking-wide ${relationColor[e.relation]}`}>
                  is {e.relation === 'contradicts' ? 'contradicted' : e.relation === 'supersedes' ? 'superseded' : 'supported'} by
                </span>
                <p className="mt-1 text-sm text-[var(--t1)]">{e.from?.statement}</p>
                {e.reason ? <p className="mt-1 text-xs text-[var(--t3)]">{e.reason}</p> : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  )
}
