'use client'

import ReactMarkdown from 'react-markdown'

// Renders an agent answer as formatted Markdown (bold, inline code, lists) so the
// model's output reads cleanly instead of showing raw ** and backticks. Styled for
// both themes via the CSS-variable tokens.
export default function Answer({text, tone = 'default'}: {text: string; tone?: 'default' | 'muted'}) {
  const base = tone === 'muted' ? 'text-[var(--t2)]' : 'text-[var(--t1)]'
  return (
    <div className={`space-y-2 text-[14px] leading-relaxed ${base}`}>
      <ReactMarkdown
        components={{
          p: ({children}) => <p className="whitespace-pre-wrap">{children}</p>,
          strong: ({children}) => <strong className="font-semibold text-[var(--t1)]">{children}</strong>,
          em: ({children}) => <em className="italic">{children}</em>,
          code: ({children}) => (
            <code className="rounded bg-[var(--s2)] px-1 py-0.5 font-mono text-[13px] text-[var(--t1)]">
              {children}
            </code>
          ),
          ul: ({children}) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({children}) => <li>{children}</li>,
          a: ({href, children}) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[var(--accent-emerald)] underline underline-offset-2">
              {children}
            </a>
          ),
          h1: ({children}) => <p className="font-semibold text-[var(--t1)]">{children}</p>,
          h2: ({children}) => <p className="font-semibold text-[var(--t1)]">{children}</p>,
          h3: ({children}) => <p className="font-semibold text-[var(--t1)]">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
