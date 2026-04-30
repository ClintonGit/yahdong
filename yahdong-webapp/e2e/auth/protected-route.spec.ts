import { test, expect } from '@playwright/test'

test.describe('ProtectedRoute', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage ก่อน navigate เพื่อให้แน่ใจว่าไม่มี auth state
    // zustand persist เก็บ key 'yahdong-auth' ใน localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('yahdong-auth')
    })
  })

  test('เข้า / โดยไม่ login → redirect ไป /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('เข้า /projects โดยไม่ login → redirect ไป /login', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL('/login')
  })

  test('เข้า route ที่ไม่มีอยู่ → redirect ไป /login', async ({ page }) => {
    // route ที่ไม่ match ใดๆ จะถูก navigate to /login ตาม <Route path="*">
    await page.goto('/some-unknown-route')
    await expect(page).toHaveURL('/login')
  })
})
