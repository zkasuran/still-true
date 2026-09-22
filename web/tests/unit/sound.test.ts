import {describe, it, expect, beforeEach, vi} from 'vitest'

// Exercises the real sound engine (web/app/lib/sound.ts): the muted flag, how it
// persists to localStorage, and how it rehydrates on load. jsdom has no
// AudioContext, so the tone playback is a no-op here, which is exactly what we
// want, the audio is not under test, the state machine is.
async function freshSound() {
  vi.resetModules()
  return import('../../app/lib/sound')
}

describe('sound muted-state and localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to unmuted when nothing is persisted', async () => {
    const {isMuted} = await freshSound()
    expect(isMuted()).toBe(false)
  })

  it('setMuted persists the choice and isMuted reflects it', async () => {
    const {isMuted, setMuted} = await freshSound()

    setMuted(true)
    expect(localStorage.getItem('sound')).toBe('off')
    expect(isMuted()).toBe(true)

    setMuted(false)
    expect(localStorage.getItem('sound')).toBe('on')
    expect(isMuted()).toBe(false)
  })

  it('rehydrates a persisted mute on first use after load', async () => {
    localStorage.setItem('sound', 'off')
    const {isMuted} = await freshSound()
    expect(isMuted()).toBe(true)
  })

  it('treats any stored value other than "off" as unmuted', async () => {
    localStorage.setItem('sound', 'on')
    const {isMuted} = await freshSound()
    expect(isMuted()).toBe(false)
  })
})
