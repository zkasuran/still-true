import {test, expect} from '@playwright/test'

// (d) the contradiction graph and the timeline sections are both present on the board.
test('graph and timeline sections are present', async ({page}) => {
  await page.goto('/')

  // the graph renders as an accessible SVG image
  await expect(page.getByRole('img', {name: 'Contradiction graph'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'What is contested and what replaced what'})).toBeVisible()

  // the timeline exposes a labelled range slider
  await expect(page.getByRole('slider', {name: 'Scrub through time'})).toBeVisible()
  await expect(page.getByRole('heading', {name: 'Watch the truth change'})).toBeVisible()
  await expect(page.getByText('the current truth, as of')).toBeVisible()
})
