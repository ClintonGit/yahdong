import { toast } from 'sonner'
import dong02 from '../assets/dong/dong-sticker-02-เลยกำหนด.png'
import dong03 from '../assets/dong/dong-sticker-03-เสร็จแล้ว.png'
import dong04 from '../assets/dong/dong-sticker-04-sprint-ใหม่.png'
import dong06 from '../assets/dong/dong-sticker-06-กลับบ้าน.png'

function DongNode({ img, msg, sub }: { img: string; msg: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <img src={img} alt="" className="h-12 w-12 shrink-0 object-contain" />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-family-heading)' }}>
          {msg}
        </p>
        {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{sub}</p>}
      </div>
    </div>
  )
}

export const dongToast = {
  overdue: (title: string) =>
    toast.custom(() => (
      <DongNode img={dong02} msg="เลยกำหนดแล้วนะ 👀" sub={title} />
    ), { duration: 4000 }),

  done: (title: string) =>
    toast.custom(() => (
      <DongNode img={dong03} msg="เสร็จแล้ว! 🎉 ดึกนะ" sub={title} />
    ), { duration: 3500 }),

  newProject: (name: string) =>
    toast.custom(() => (
      <DongNode img={dong04} msg="เริ่มโปรเจคใหม่แล้ว! ⚡" sub={name} />
    ), { duration: 4000 }),

  allClear: () =>
    toast.custom(() => (
      <DongNode img={dong06} msg="กลับบ้านได้แล้ว! 🏡" sub="ทุกงานเสร็จหมดแล้วค่ะ" />
    ), { duration: 5000 }),
}
