import {test, expect} from '@playwright/test'

// (b) the theme toggle adds and removes the `.dark` class on <html>. The check is
// relative to the starting state so it holds whether the page boots light or dark.
test('theme toggle flips the dark class on <html>', async ({page}) => {
  await page.goto('/')

  const html = page.locator('html')
  const toggle = page.getByRole('button', {name: /Switch to (light|dark) mode/})
  await expect(toggle).toBeVisible()

  const startedDark = await html.evaluate((el) => el.classList.contains('dark'))

  await toggle.click()
  expect(await html.evaluate((el) => el.classList.contains('dark'))).toBe(!startedDark)

  await toggle.click()
  expect(await html.evaluate((el) => el.classList.contains('dark'))).toBe(startedDark)
})
