import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/auth'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
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
      const res = await authApi.login(data)
      setAuth(res.data.user, {
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      })
      navigate('/')
    } catch {
      setServerError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
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
            อย่าดอง
          </CardTitle>
          <CardDescription style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            เข้าสู่ระบบเพื่อจัดการงานของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
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
              {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
            <p
              className="text-center text-sm"
              style={{ color: 'var(--color-text)', opacity: 0.7 }}
            >
              ยังไม่มีบัญชี?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--color-primary)' }}
                className="font-medium hover:underline"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
