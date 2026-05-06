import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { inviteApi } from '../api/projects'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'

interface InviteInfo {
  token: string
  expiresAt: string
  project: { id: string; name: string; color: string }
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()
  const isLoggedIn = !!accessToken

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    inviteApi
      .getInvite(token)
      .then((r) => setInvite(r.data))
      .catch(() => setError('ลิงก์เชิญไม่ถูกต้องหรือหมดอายุแล้ว'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    setAccepting(true)
    try {
      const { data } = await inviteApi.acceptInvite(token)
      toast.success('เข้าร่วมโปรเจคสำเร็จ')
      navigate(`/projects/${data.projectId}`)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'ไม่สามารถรับคำเชิญได้'
      toast.error(msg)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>กำลังโหลด...</p>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Card className="w-full max-w-sm" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-border-forest)' }}>
          <CardHeader className="text-center">
            <CardTitle style={{ color: 'var(--color-text)' }}>ลิงก์ไม่ถูกต้อง</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/projects">
              <Button style={{ background: 'var(--color-primary)', color: 'white' }}>ไปหน้าโปรเจค</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <Card className="w-full max-w-sm" style={{ background: 'var(--color-paper)', borderColor: 'var(--color-border-forest)' }}>
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
              style={{ background: invite.project.color }}
            >
              {invite.project.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <CardTitle style={{ color: 'var(--color-text)' }}>คุณได้รับคำเชิญ</CardTitle>
          <CardDescription>
            เข้าร่วมโปรเจค <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{invite.project.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoggedIn ? (
            <Button
              className="w-full"
              style={{ background: 'var(--color-primary)', color: 'white' }}
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? 'กำลังเข้าร่วม...' : 'รับคำเชิญ'}
            </Button>
          ) : (
            <>
              <p className="text-xs text-center" style={{ color: 'var(--color-muted-foreground)' }}>
                เข้าสู่ระบบก่อนเพื่อรับคำเชิญ
              </p>
              <Link to={`/login?redirect=/invite/${token}`} className="block">
                <Button className="w-full" style={{ background: 'var(--color-primary)', color: 'white' }}>
                  เข้าสู่ระบบ
                </Button>
              </Link>
              <Link to={`/register?redirect=/invite/${token}`} className="block">
                <Button variant="outline" className="w-full" style={{ borderColor: 'var(--color-border-forest)', color: 'var(--color-text)' }}>
                  สมัครสมาชิก
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
