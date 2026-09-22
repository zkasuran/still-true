import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {render, screen, fireEvent, cleanup} from '@testing-library/react'
import ThemeToggle from '../../app/components/ThemeToggle'

// Renders the real ThemeToggle client component and drives its click handler,
// asserting the same behaviour the e2e theme test checks (the `.dark` class on
// <html> and the persisted theme) but at unit speed with no browser.
describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('adds and removes the dark class on <html> and persists the choice', () => {
    document.documentElement.classList.add('dark') // start in dark, as the app boots
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')

    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('exposes an accessible label that matches the current mode', () => {
    document.documentElement.classList.add('dark')
    render(<ThemeToggle />)
    // dark mode -> the button offers to switch to light
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Switch to light mode')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Switch to dark mode')
  })
})
