'use client'

// A tiny synthesized sound layer for interface effects. No files, no latency,
// generated with the Web Audio API. MiniMax voice handles spoken answers (the
// Listen button); these are the clicks, chimes and alerts. Sounds only fire on
// user gestures, so nothing autoplays.

let ctx: AudioContext | null = null
let muted = false
let inited = false

function init() {
  if (inited || typeof window === 'undefined') return
  inited = true
  try {
    muted = localStorage.getItem('sound') === 'off'
  } catch {}
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

type ToneOpts = {type?: OscillatorType; gain?: number; glideTo?: number; delay?: number}

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  const c = ac()
  if (!c) return
  const {type = 'sine', gain = 0.05, glideTo, delay = 0} = opts
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + dur)
  // quick attack, smooth exponential release for a soft, non-clicky envelope
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function isMuted() {
  init()
  return muted
}

export function setMuted(m: boolean) {
  init()
  muted = m
  try {
    localStorage.setItem('sound', m ? 'off' : 'on')
  } catch {}
  if (!m) tone(660, 0.09, {type: 'sine', gain: 0.05}) // confirm un-mute
}

export const sfx = {
  click() {
    init()
    if (muted) return
    tone(240, 0.07, {type: 'triangle', gain: 0.04, glideTo: 150})
  },
  tick() {
    init()
    if (muted) return
    tone(880, 0.028, {type: 'sine', gain: 0.02})
  },
  send() {
    init()
    if (muted) return
    tone(320, 0.09, {type: 'triangle', gain: 0.045, glideTo: 520})
  },
  chime() {
    init()
    if (muted) return
    tone(523.25, 0.16, {type: 'sine', gain: 0.05})
    tone(783.99, 0.24, {type: 'sine', gain: 0.045, delay: 0.085})
  },
  alert() {
    init()
    if (muted) return
    // two-tone amber "attention" for a surfaced conflict, pleasant not harsh
    tone(392, 0.13, {type: 'triangle', gain: 0.05})
    tone(587.33, 0.18, {type: 'triangle', gain: 0.05, delay: 0.11})
  },
}
