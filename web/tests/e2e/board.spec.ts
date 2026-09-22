import {test, expect} from '@playwright/test'

// (a) the board renders the hero, real claim content and the stats line.
test('board renders hero, claim content and stats', async ({page}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', {level: 1})).toContainText('shows its receipts')

  // the stats line proves real claims came back from Sanity (not an empty board).
  // `\d+ contested` targets the stats count, not the "What is contested" heading.
  await expect(page.getByText(/[1-9]\d* claims/)).toBeVisible()
  await expect(page.getByText(/\d+ contested/)).toBeVisible()

  // the per-source claim list section is present
  await expect(page.getByRole('heading', {name: 'Every claim, with its source'})).toBeVisible()

  // the head-to-head showdown, the core claim-driven UI, is on the page
  await expect(page.getByRole('button', {name: /Run the showdown/})).toBeVisible()
})
