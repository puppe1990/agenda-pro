import { expect, test } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: /Agenda, clientes/i }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Começar grátis' })).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})
