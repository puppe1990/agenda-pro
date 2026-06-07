import { expect, test } from '@playwright/test'

import { signInWithApi, waitForAppReady } from './helpers'

const E2E_EMAIL = 'e2e-fixed@gmail.com'
const E2E_PASSWORD = 'SenhaE2E-123'

function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test.describe('authenticated flows', () => {
  test('login, client search and appointment', async ({
    page,
    request,
    baseURL,
  }) => {
    const runId = Date.now()
    const clientName = `Cliente E2E ${runId}`
    const serviceName = `Consulta E2E ${runId}`

    await signInWithApi(baseURL!, request, page, E2E_EMAIL, E2E_PASSWORD)
    await page.goto('/app/dashboard')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.goto('/app/servicos')
    await waitForAppReady(page)
    await page.getByPlaceholder('Nome do serviço').fill(serviceName)
    await page.getByRole('button', { name: 'Adicionar serviço' }).click()
    await expect(page.getByText(serviceName)).toBeVisible()

    await page.goto('/app/clientes')
    await waitForAppReady(page)
    await page
      .getByRole('textbox', { name: 'Nome', exact: true })
      .fill(clientName)
    await page
      .getByRole('textbox', { name: 'Telefone', exact: true })
      .fill('11988887777')
    await page.getByRole('button', { name: 'Salvar cliente' }).click()
    await expect(page.getByText(clientName)).toBeVisible()

    await page.getByPlaceholder('Buscar por nome ou telefone').fill(clientName)
    await expect(page.getByText(clientName)).toBeVisible()

    await page.goto('/app/agenda')
    await waitForAppReady(page)
    const appointmentDate = localDateString()
    await page.locator('select').nth(0).selectOption({ label: clientName })
    await page.locator('select').nth(1).selectOption({ label: serviceName })
    await page
      .locator('select')
      .nth(2)
      .selectOption({ label: 'E2E Profissional' })
    await page.locator('form input[type="date"]').fill(appointmentDate)
    await page.locator('form input[type="time"]').fill('10:00')
    await expect(page.locator('form input[type="date"]')).toHaveValue(
      appointmentDate,
    )
    await expect(page.locator('select').nth(0)).not.toHaveValue('')
    await expect(page.locator('select').nth(1)).not.toHaveValue('')
    await expect(page.locator('select').nth(2)).not.toHaveValue('')
    await page.getByRole('button', { name: 'Agendar' }).click()
    await page.waitForLoadState('load')
    await waitForAppReady(page)
    const appointment = page.locator('ul.space-y-3 > li').filter({
      hasText: clientName,
    })
    await expect(appointment).toBeVisible()
    await expect(appointment).toContainText('Agendado')
  })
})
