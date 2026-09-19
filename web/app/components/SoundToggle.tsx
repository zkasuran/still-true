'use client'

import {useEffect, useState} from 'react'
import {isMuted, setMuted} from '../lib/sound'

export default function SoundToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(!isMuted())
  }, [])

  function toggle() {
    const next = !on
    setMuted(!next)
    setOn(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Mute interface sounds' : 'Unmute interface sounds'}
      className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-black/[0.04] hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
    >
      {on ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H2v6h4l5 4z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H2v6h4l5 4z" />
          <path d="M22 9l-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
  )
}
