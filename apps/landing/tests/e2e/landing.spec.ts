import { expect, test } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')
  await expect(
    page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Blog' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /Agenda, clientes/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Começar grátis' }).first(),
  ).toBeVisible()
})

test('cta links point to app urls', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('link', { name: 'Começar grátis' }).first(),
  ).toHaveAttribute('href', 'http://localhost:3000/signup')
})

test('footer and floating whatsapp buttons are visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.getByText('Todos os direitos reservados.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Falar com suporte pelo WhatsApp' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Agendar demonstração pelo WhatsApp' }),
  ).toBeVisible()
})

test('section anchors are present', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#recursos')).toBeVisible()
  await expect(page.locator('#como-funciona')).toBeVisible()
  await expect(page.locator('#depoimentos')).toBeVisible()
  await expect(page.locator('#blog')).toBeVisible()
  await expect(page.locator('#faq')).toBeVisible()
})

test('blog index lists articles', async ({ page }) => {
  await page.goto('/blog')
  await expect(
    page.getByRole('heading', { name: /Blog Gestão Bem/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /reduzir faltas na agenda/i }),
  ).toBeVisible()
})

test('blog post page renders mdx content', async ({ page }) => {
  await page.goto('/blog/reduzir-faltas-na-agenda')
  await expect(
    page.getByRole('heading', { name: /5 formas de reduzir faltas/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /Confirme com antecedência/i }),
  ).toBeVisible()
})
