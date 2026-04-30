import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { authApi } from '../api/auth'
import { useState } from 'react'

const schema = z
  .object({
    name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setServerError('')
      await authApi.register({ name: data.name, email: data.email, password: data.password })
      navigate('/login')
    } catch (err: unknown) {
      const msg =
        err !== null &&
        typeof err === 'object' &&
        'response' in err &&
        err.response !== null &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data !== null &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? (err.response.data as { message: string }).message
          : ''
      setServerError(msg === 'Email already in use' ? 'อีเมลนี้ถูกใช้งานแล้ว' : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}
    >
      <Card className="w-full max-w-sm shadow-md" style={{ background: 'var(--color-card)' }}>
        <CardHeader className="text-center space-y-1">
          <CardTitle
            className="text-3xl"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--color-primary)',
            }}
          >
            สมัครสมาชิก
          </CardTitle>
          <CardDescription style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            เริ่มต้นใช้งาน อย่าดอง
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">ชื่อ</Label>
              <Input id="name" placeholder="ดอง" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="dong@yahdong.app"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            {serverError && (
              <p className="text-sm text-red-500 text-center">{serverError}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              style={{ background: 'var(--color-primary)', color: 'var(--color-card)' }}
            >
              {isSubmitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </Button>
            <p
              className="text-center text-sm"
              style={{ color: 'var(--color-text)', opacity: 0.7 }}
            >
              มีบัญชีอยู่แล้ว?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--color-primary)' }}
                className="font-medium hover:underline"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
