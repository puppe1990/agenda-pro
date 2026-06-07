import { expect } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

export async function waitForAppReady(page: Page) {
  await page.waitForSelector('html[data-e2e-ready="true"]', {
    timeout: 15_000,
  })
}

export async function signInWithApi(
  baseURL: string,
  request: APIRequestContext,
  page: Page,
  email: string,
  password: string,
) {
  const login = await request.post(`${baseURL}/api/auth/sign-in/email`, {
    data: { email, password },
  })
  expect(login.ok()).toBeTruthy()

  const state = await request.storageState()
  await page.context().addCookies(state.cookies)
}
