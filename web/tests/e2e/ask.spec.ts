import {test, expect} from '@playwright/test'

// (c) the /ask page loads with the agent input ready.
test('ask page loads with the question input', async ({page}) => {
  await page.goto('/ask')

  await expect(page.getByRole('heading', {name: 'Ask the grounded agent'})).toBeVisible()

  const input = page.getByPlaceholder('Ask about Next.js…')
  await expect(input).toBeVisible()
  await expect(input).toBeEditable()

  await expect(page.getByRole('button', {name: 'Ask'})).toBeVisible()
})
