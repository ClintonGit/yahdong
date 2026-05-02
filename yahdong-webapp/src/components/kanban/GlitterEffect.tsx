import { useEffect, useMemo } from 'react'

interface Particle {
  id: number
  gx: number
  gy: number
  size: number
  color: string
  duration: number
  round: boolean
}

// Forest World palette สำหรับ glitter
const PALETTE = [
  '#E8A030', // primary orange
  '#4A7C5E', // forest green
  '#C8956A', // wood brown
  '#FDE68A', // light gold
  '#A7F3D0', // light mint
  '#ffffff', // white sparkle
  '#FED7AA', // peach
  '#F59E0B', // amber
]

interface Props {
  x: number
  y: number
  onDone: () => void
}

export default function GlitterEffect({ x, y, onDone }: Props) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * 2 * Math.PI + (Math.random() - 0.5) * 0.4
        const distance = 30 + Math.random() * 65
        return {
          id: i,
          gx: Math.cos(angle) * distance,
          gy: Math.sin(angle) * distance,
          size: 4 + Math.random() * 6,
          color: PALETTE[i % PALETTE.length],
          duration: 380 + Math.random() * 300,
          round: i % 3 !== 0, // mix วงกลมกับสี่เหลี่ยม
        }
      }),
    [],
  )

  const maxDuration = Math.max(...particles.map((p) => p.duration))

  useEffect(() => {
    const timer = setTimeout(onDone, maxDuration + 60)
    return () => clearTimeout(timer)
  }, [onDone, maxDuration])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={
            {
              position: 'absolute',
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.round ? '50%' : '2px',
              animationName: 'glitter-fly',
              animationDuration: `${p.duration}ms`,
              animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.4, 1)',
              animationFillMode: 'forwards',
              '--gx': `${p.gx}px`,
              '--gy': `${p.gy}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
