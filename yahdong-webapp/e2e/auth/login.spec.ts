import { test, expect } from '@playwright/test'
import { mockLoginSuccess, mockLoginError, mockProjectsList } from '../helpers/auth'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage ก่อน navigate เพื่อให้แน่ใจว่าไม่มี auth state เก่าค้างอยู่
    // ใช้ addInitScript เพราะต้อง run ก่อนที่ zustand persist จะ rehydrate
    await page.addInitScript(() => {
      localStorage.removeItem('yahdong-auth')
    })
    await page.goto('/login')
    // รอ form แสดงก่อน
    await page.getByLabel('อีเมล').waitFor({ state: 'visible' })
  })

  test('แสดง login form ครบถ้วน', async ({ page }) => {
    // CardTitle render เป็น <div> ไม่ใช่ heading — ใช้ getByText แทน
    await expect(page.getByText('อย่าดอง')).toBeVisible()
    await expect(page.getByLabel('อีเมล')).toBeVisible()
    await expect(page.getByLabel('รหัสผ่าน')).toBeVisible()
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'สมัครสมาชิก' })).toBeVisible()
  })

  test('แสดง validation error เมื่อ submit form ว่าง', async ({ page }) => {
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page.getByText('อีเมลไม่ถูกต้อง')).toBeVisible()
  })

  test('แสดง error เมื่อ email รูปแบบผิด', async ({ page }) => {
    await page.getByLabel('อีเมล').fill('notanemail')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page.getByText('อีเมลไม่ถูกต้อง')).toBeVisible()
  })

  test('login สำเร็จ → redirect ไป /projects', async ({ page }) => {
    await mockLoginSuccess(page)
    await mockProjectsList(page)

    await page.getByLabel('อีเมล').fill('dong@test.com')
    await page.getByLabel('รหัสผ่าน').fill('password123')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    // login navigates ไป / ซึ่ง redirect ต่อไป /projects
    await expect(page).toHaveURL('/projects')
  })

  test('login ผิดพลาด → แสดง error message', async ({ page }) => {
    await mockLoginError(page)

    await page.getByLabel('อีเมล').fill('wrong@test.com')
    await page.getByLabel('รหัสผ่าน').fill('wrongpassword')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()

    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
  })

  test('link "สมัครสมาชิก" นำไปหน้า register', async ({ page }) => {
    await page.getByRole('link', { name: 'สมัครสมาชิก' }).click()
    await expect(page).toHaveURL('/register')
  })
})
