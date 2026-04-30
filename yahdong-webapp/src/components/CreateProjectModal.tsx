import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useCreateProject } from '../hooks/useProjects'

const COLORS = [
  '#E8A030',
  '#4A7C5E',
  '#C8956A',
  '#8B6343',
  '#7A9E7E',
  '#6366F1',
  '#EC4899',
  '#F97316',
]

const schema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateProjectModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [color, setColor] = useState(COLORS[0])
  const createProject = useCreateProject()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const project = await createProject.mutateAsync({ ...data, color })
    reset()
    onClose()
    navigate(`/projects/${project.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent style={{ background: 'var(--color-card)' }}>
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--color-text)',
            }}
          >
            สร้างโปรเจคใหม่
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>ชื่อโปรเจค</Label>
            <Input placeholder="เช่น งาน Q2 2026" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>คำอธิบาย (ไม่บังคับ)</Label>
            <Input
              placeholder="โปรเจคนี้เกี่ยวกับ..."
              {...register('description')}
            />
          </div>
          <div className="space-y-2">
            <Label>สีโปรเจค</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor:
                      color === c ? 'var(--color-text)' : 'transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
              style={{ background: 'var(--color-primary)' }}
            >
              {isSubmitting ? 'กำลังสร้าง...' : 'สร้างโปรเจค'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
