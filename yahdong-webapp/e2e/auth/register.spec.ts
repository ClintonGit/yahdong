import { test, expect } from '@playwright/test'
import { mockRegisterSuccess, mockRegisterConflict } from '../helpers/auth'

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    // รอ form แสดงก่อน
    await page.getByLabel('ชื่อ').waitFor({ state: 'visible' })
  })

  test('แสดง register form ครบถ้วน', async ({ page }) => {
    // CardTitle render เป็น <div> ไม่ใช่ heading — ใช้ getByText แทน
    // ใช้ .first() เพราะ "สมัครสมาชิก" อาจปรากฎใน CardTitle และ link
    await expect(page.getByText('สมัครสมาชิก').first()).toBeVisible()
    await expect(page.getByLabel('ชื่อ')).toBeVisible()
    await expect(page.getByLabel('อีเมล')).toBeVisible()
    await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toBeVisible()
    await expect(page.getByLabel('ยืนยันรหัสผ่าน')).toBeVisible()
  })

  test('validation: ชื่อสั้นเกินไป', async ({ page }) => {
    await page.getByLabel('ชื่อ').fill('a')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).click()
    await expect(page.getByText('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')).toBeVisible()
  })

  test('validation: password สั้นเกินไป', async ({ page }) => {
    await page.getByLabel('ชื่อ').fill('ดอง')
    await page.getByLabel('อีเมล').fill('dong@test.com')
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('short')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).click()
    await expect(page.getByText('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeVisible()
  })

  test('validation: password ไม่ตรงกัน', async ({ page }) => {
    await page.getByLabel('ชื่อ').fill('ดอง')
    await page.getByLabel('อีเมล').fill('dong@test.com')
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('password123')
    await page.getByLabel('ยืนยันรหัสผ่าน').fill('differentpass')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).click()
    await expect(page.getByText('รหัสผ่านไม่ตรงกัน')).toBeVisible()
  })

  test('register สำเร็จ → redirect ไป /login', async ({ page }) => {
    await mockRegisterSuccess(page)

    await page.getByLabel('ชื่อ').fill('ดอง')
    await page.getByLabel('อีเมล').fill('dong@test.com')
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('password123')
    await page.getByLabel('ยืนยันรหัสผ่าน').fill('password123')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).click()

    await expect(page).toHaveURL('/login')
  })

  test('email ซ้ำ → แสดง error อีเมลนี้ถูกใช้งานแล้ว', async ({ page }) => {
    await mockRegisterConflict(page)

    await page.getByLabel('ชื่อ').fill('ดอง')
    await page.getByLabel('อีเมล').fill('existing@test.com')
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('password123')
    await page.getByLabel('ยืนยันรหัสผ่าน').fill('password123')
    await page.getByRole('button', { name: 'สมัครสมาชิก' }).click()

    await expect(page.getByText('อีเมลนี้ถูกใช้งานแล้ว')).toBeVisible()
  })
})
