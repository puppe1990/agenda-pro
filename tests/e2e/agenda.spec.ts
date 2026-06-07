import { expect, test } from '@playwright/test'

test.describe('agenda flows', () => {
  test('signup and onboarding pages are reachable', async ({ page }) => {
    await page.goto('/signup')
    await expect(
      page.getByRole('heading', { name: 'Criar conta' }),
    ).toBeVisible()
  })

  test('public booking route renders', async ({ page }) => {
    await page.goto('/book/studio-demo')
    await expect(page.getByText(/Agendar com/i)).toBeVisible()
  })
})
