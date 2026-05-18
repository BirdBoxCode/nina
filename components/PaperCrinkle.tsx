'use client'

import { useEffect, useRef } from 'react'

interface Crease {
  x: number
  y: number
  angle: number
  length: number
  width: number
  opacity: number
  decay: number
}

export function PaperCrinkle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const creases = useRef<Crease[]>([])
  const rafRef = useRef<number>(0)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      const x = e.clientX
      const y = e.clientY

      // Only spawn crinkles when cursor has moved a minimum distance
      if (lastPos.current) {
        const dx = x - lastPos.current.x
        const dy = y - lastPos.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 6) return
      }
      lastPos.current = { x, y }

      const count = Math.floor(Math.random() * 3) + 2
      for (let i = 0; i < count; i++) {
        const spread = 22
        creases.current.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + (Math.random() - 0.5) * spread,
          angle: Math.random() * Math.PI,
          length: 14 + Math.random() * 30,
          width: 0.4 + Math.random() * 1.1,
          opacity: 0.32 + Math.random() * 0.18,
          decay: 0.006 + Math.random() * 0.006,
        })
      }
    }

    window.addEventListener('mousemove', onMouseMove)

    const ctx = canvas.getContext('2d')!

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      creases.current = creases.current.filter((c) => c.opacity > 0)

      for (const c of creases.current) {
        const halfLen = c.length / 2
        const x1 = c.x - Math.cos(c.angle) * halfLen
        const y1 = c.y - Math.sin(c.angle) * halfLen
        const x2 = c.x + Math.cos(c.angle) * halfLen
        const y2 = c.y + Math.sin(c.angle) * halfLen

        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0, `rgba(148, 136, 124, 0)`)
        grad.addColorStop(0.35, `rgba(148, 136, 124, ${c.opacity})`)
        grad.addColorStop(0.65, `rgba(148, 136, 124, ${c.opacity})`)
        grad.addColorStop(1, `rgba(148, 136, 124, 0)`)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = grad
        ctx.lineWidth = c.width
        ctx.stroke()

        c.opacity -= c.decay
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  )
}
