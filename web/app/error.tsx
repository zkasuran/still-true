'use client'

export default function Error({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--t1)]">Something broke on our side</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--t3)]">
        The page hit an unexpected error. The knowledge base and the agent are still there, so a retry
        usually clears it.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900"
      >
        Try again
      </button>
    </main>
  )
}
