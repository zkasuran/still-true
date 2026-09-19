import AgentDemo from '../components/AgentDemo'

export const metadata = {title: 'Ask · Still True?'}

export default function AskPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
      <section className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--b1)] bg-[var(--s1)] px-3 py-1 text-xs text-[var(--t2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Grounded in a Knowledge Base, never memory
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--t1)] sm:text-4xl">
          Ask the grounded agent
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--t2)]">
          It answers only from the Sanity Context Knowledge Base, checks for conflicts, and shows both
          sides when two sources disagree instead of guessing. Every answer cites the entries it read.
        </p>
      </section>
      <AgentDemo autofocus />
      <p className="mt-8 text-center text-sm text-[var(--t3)]">
        Want to see the sources?{' '}
        <a href="/" className="text-[var(--t2)] underline underline-offset-2 hover:text-[var(--t1)]">
          Browse the knowledge graph
        </a>
        .
      </p>
    </main>
  )
}
