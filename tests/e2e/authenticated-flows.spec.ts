import { expect, test } from '@playwright/test'

const E2E_EMAIL = 'e2e-fixed@gmail.com'
const E2E_PASSWORD = 'SenhaE2E-123'

function tomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

test.describe('authenticated flows', () => {
  test.skip('session login, onboarding, client search and appointment', async ({
    page,
    request,
    baseURL,
  }) => {
    const clientName = `Cliente E2E ${Date.now()}`

    const login = await request.post(`${baseURL}/api/auth/sign-in/email`, {
      data: {
        email: E2E_EMAIL,
        password: E2E_PASSWORD,
      },
    })
    expect(login.ok()).toBeTruthy()

    await page.goto('/app/dashboard')
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible(
      {
        timeout: 15_000,
      },
    )

    await page.goto('/onboarding')
    await page.getByPlaceholder('Ex: Studio Bella').fill('Studio E2E')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.waitForURL('**/app/dashboard', { timeout: 15_000 })

    await page.goto('/app/servicos')
    await page.getByPlaceholder('Nome do serviço').fill('Consulta E2E')
    await page.getByRole('button', { name: 'Adicionar serviço' }).click()
    await page.waitForLoadState('networkidle')

    await page.goto('/app/clientes')
    await page.getByPlaceholder('Nome').fill(clientName)
    await page.getByPlaceholder('Telefone').fill('11988887777')
    await page.getByRole('button', { name: 'Salvar cliente' }).click()
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Buscar por nome ou telefone').fill(clientName)
    await expect(page.getByText(clientName)).toBeVisible()

    await page.goto('/app/agenda')
    await page.locator('select').nth(0).selectOption({ label: clientName })
    await page.locator('select').nth(1).selectOption({ index: 1 })
    await page.locator('select').nth(2).selectOption({ index: 1 })
    await page.locator('input[type="date"]').last().fill(tomorrowDate())
    await page.locator('input[type="time"]').fill('10:00')
    await page.getByRole('button', { name: 'Agendar' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(clientName)).toBeVisible()
    await expect(page.getByText('scheduled')).toBeVisible()
  })
})
