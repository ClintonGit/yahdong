import { Page } from '@playwright/test'

export async function mockLoginSuccess(page: Page) {
  await page.route('**/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { id: 'user-1', name: 'ดอง', email: 'dong@test.com', avatar: null },
      }),
    }),
  )
}

export async function mockLoginError(page: Page) {
  await page.route('**/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid credentials', statusCode: 401 }),
    }),
  )
}

export async function mockRegisterSuccess(page: Page) {
  await page.route('**/auth/register', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'user-1', name: 'ดอง', email: 'dong@test.com' }),
    }),
  )
}

export async function mockRegisterConflict(page: Page) {
  await page.route('**/auth/register', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Email already in use', statusCode: 409 }),
    }),
  )
}

export async function mockProjectsList(page: Page) {
  await page.route('**/projects', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  )
}
