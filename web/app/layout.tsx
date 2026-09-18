import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Still True? — a knowledge base that keeps itself honest',
  description:
    'A Claude API knowledge base that tells you which fact is current and shows both sides when two sources disagree. A grounded agent and a contradiction board over one Sanity Context graph.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#09090b]/70 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
            <a href="/" className="group flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white">
                Still True?
              </span>
            </a>
            <nav className="flex items-center gap-1 text-sm">
              <a
                href="/"
                className="rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100"
              >
                Board
              </a>
              <a
                href="/ask"
                className="rounded-md px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100"
              >
                Ask
              </a>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
