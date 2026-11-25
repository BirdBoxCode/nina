'use client'

import React, { useEffect, useRef } from 'react'
import { InkArt } from '@/components/InkArt'

/**
 * Atmosphere for the home page's night (dusk) section, in the pigment palette:
 *   NightAir   — slow colour washes, drifting haze bands and light shafts on the ground
 *   MoteField  — glowing motes on a canvas, one depth plane per instance
 *   Glint      — a band of light that now and then runs along a line drawing
 * Everything holds still under reduced motion (the keyframes are switched off in
 * globals.css, and MoteField stops its clock).
 */

/* Pigment colours as rgb triples, for translucent fills. */
const LAVENDER = '197, 200, 245' // lavenderMist
const PERIWINKLE = '142, 151, 192' // periwinkle
const SAGE = '150, 151, 136' // sage

/* ------------------------------------------------------------------------------------ */
/* NightAir                                                                             */
/* ------------------------------------------------------------------------------------ */

/* Haze bands: top (share of the section), slide period (s) and scroll lag. The lag is a
   share of the section's on-screen top, read from --ny on an ancestor: higher lags more,
   so the bands part into depths as the page scrolls. */
const HAZE = [
  { top: '6%', period: 64, delay: -12, lag: 0.08, alpha: 0.07 },
  { top: '30%', period: 78, delay: -40, lag: 0.18, alpha: 0.06 },
  { top: '55%', period: 56, delay: -5, lag: 0.26, alpha: 0.075 },
  { top: '80%', period: 70, delay: -30, lag: 0.13, alpha: 0.06 },
]

/* Light shafts: left edge, width, tilt, swell period (s) and offset. `wide` ones are
   desktop only. */
const SHAFTS = [
  { left: '12%', width: '10vw', tilt: 17, period: 11, delay: -2, wide: false },
  { left: '33%', width: '6vw', tilt: 14, period: 14, delay: -9, wide: true },
  { left: '57%', width: '13vw', tilt: 19, period: 9, delay: -5, wide: false },
  { left: '80%', width: '7vw', tilt: 15, period: 16, delay: -12, wide: true },
]

/**
 * The ground's moving air. Fills its (relative, full-bleed) parent; faded in over `fade`
 * at the top so none of it shows on the paper.
 */
export function NightAir({ fade }: { fade: string }) {
  const mask = `linear-gradient(to bottom, transparent calc(${fade} * .3), #000 ${fade})`
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      {/* Colour washes: periwinkle and sage pools wandering on long, unrelated cycles,
          repeated down the section so the hue never quite settles anywhere. */}
      <div
        className="absolute inset-[-15%]"
        style={{
          background: `radial-gradient(ellipse 38% 45% at 22% 40%, rgba(${PERIWINKLE}, .13), transparent 70%)`,
          backgroundSize: '100% 140vh',
          animation: 'nr-wash 48s ease-in-out -7s infinite alternate',
        }}
      />
      <div
        className="absolute inset-[-15%]"
        style={{
          background: `radial-gradient(ellipse 34% 40% at 78% 62%, rgba(${SAGE}, .1), transparent 70%)`,
          backgroundSize: '100% 170vh',
          animation: 'nr-wash 62s ease-in-out -31s infinite alternate-reverse',
        }}
      />

      {/* Haze bands */}
      {HAZE.map((h, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: h.top,
            left: '-20%',
            width: '140%',
            height: '46vh',
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${LAVENDER}, ${h.alpha}), transparent 70%)`,
            translate: `0 calc(var(--ny, 0px) * ${-h.lag})`,
            animation: `nr-haze ${h.period}s ease-in-out ${h.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Light shafts from the top of the night, each swelling on its own time */}
      {SHAFTS.map((s, i) => (
        <div
          key={i}
          className={`absolute ${s.wide ? 'max-[899px]:hidden' : ''}`}
          style={{
            top: `calc(${fade} * .5)`,
            left: s.left,
            width: s.width,
            height: '130vh',
            transform: `rotate(${s.tilt}deg)`,
            transformOrigin: 'top center',
            background: `linear-gradient(to right, transparent, rgba(${LAVENDER}, .1) 50%, transparent)`,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 38%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, #000 18%, #000 38%, transparent)',
            translate: `0 calc(var(--ny, 0px) * -0.05)`,
            opacity: 0.7,
            animation: `nr-shaft ${s.period}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------------------------ */
/* MoteField                                                                            */
/* ------------------------------------------------------------------------------------ */

export type MoteLayer = {
  /** Motes on desktop, and below 900px wide (0 drops the layer there). */
  count: number
  narrowCount: number
  /** Glow radius range, px. */
  size: [number, number]
  /** Peak opacity range. */
  alpha: [number, number]
  /** Rise speed range, px/s. */
  rise: [number, number]
  /** Sideways sway, px. */
  sway: number
  /** Scroll speed relative to the page: below 1 is behind it, above 1 in front. */
  parallax: number
  /** 0 = a bright core with a short halo, 1 = all halo (out of focus). */
  soft: number
  /** rgb triples, picked at random per mote. */
  colors: string[]
}

type Mote = {
  x: number
  y: number
  r: number
  a: number
  rise: number
  ph: number
  tw: number
  sprite: number
}

/* A radial glow, drawn once per colour and stamped for every mote. */
function makeSprite(rgb: string, soft: number) {
  const s = 64
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  if (!g) return c
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, `rgba(${rgb}, 1)`)
  grad.addColorStop(0.12 + 0.3 * (1 - soft), `rgba(${rgb}, ${0.75 - soft * 0.35})`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return c
}

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/**
 * One depth plane of glowing motes. The canvas is fixed to the screen (so it stays
 * small however long the page is) and only draws inside `region`'s box on screen,
 * fading in over `fadeTop()` px below its top and `fadeBottom` px above its bottom.
 * Motes wrap vertically, rising on their own and shifting with the scroll at `parallax`.
 * Place it where its z-index (via `className`) puts it among the page's layers.
 */
export function MoteField({
  region,
  layer,
  fadeTop,
  fadeBottom = 0,
  className,
}: {
  region: React.RefObject<HTMLElement | null>
  layer: MoteLayer
  fadeTop?: () => number
  fadeBottom?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Read through a ref so the effect does not restart when the parent re-renders.
  const fadeTopRef = useRef(fadeTop)
  useEffect(() => {
    fadeTopRef.current = fadeTop
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sprites = layer.colors.map((c) => makeSprite(c, layer.soft))

    let motes: Mote[] = []
    let w = 0
    let h = 0
    let visible = false
    let frame = 0
    const start = performance.now()

    const seed = () => {
      const n = window.innerWidth < 900 ? layer.narrowCount : layer.count
      if (n === motes.length) return
      motes = Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: rand(layer.size[0], layer.size[1]),
        a: rand(layer.alpha[0], layer.alpha[1]),
        rise: rand(layer.rise[0], layer.rise[1]),
        ph: Math.random() * Math.PI * 2,
        tw: rand(0.4, 1.3),
        sprite: Math.floor(Math.random() * sprites.length),
      }))
    }

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const box = region.current?.getBoundingClientRect()
      if (!box || !motes.length) return
      const t = still ? 0 : (performance.now() - start) / 1000
      const ft = fadeTopRef.current?.() ?? 0
      const margin = layer.size[1] * 2 + 20
      const span = h + margin * 2
      const scroll = window.scrollY * layer.parallax
      for (const m of motes) {
        let y = (m.y * span - scroll - m.rise * t) % span
        if (y < 0) y += span
        y -= margin
        if (y < box.top - m.r || y > box.bottom + m.r) continue
        let f = 1
        if (ft) f *= smooth(box.top + ft * 0.35, box.top + ft, y)
        if (fadeBottom) f *= smooth(box.bottom, box.bottom - fadeBottom, y)
        if (f <= 0) continue
        // Twinkle, with a rare sharp glisten on top.
        const tw = 0.55 + 0.45 * Math.sin(t * m.tw + m.ph)
        const glisten = 0.7 * Math.pow(Math.max(0, Math.sin(t * m.tw * 0.37 + m.ph * 2)), 14)
        const a = Math.min(1, m.a * f * (tw + glisten))
        if (a < 0.004) continue
        const x = m.x * w + Math.sin(t * 0.25 * m.tw + m.ph) * layer.sway
        ctx.globalAlpha = a
        ctx.drawImage(sprites[m.sprite], x - m.r, y - m.r, m.r * 2, m.r * 2)
      }
      ctx.globalAlpha = 1
    }

    const loop = () => {
      draw()
      frame = visible && !still ? requestAnimationFrame(loop) : 0
    }
    const wake = () => {
      if (!visible) return
      if (still) draw()
      else if (!frame) frame = requestAnimationFrame(loop)
    }

    // Asleep (and blank) while the region is off screen.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
      else ctx.clearRect(0, 0, w, h)
    })
    if (region.current) io.observe(region.current)

    const onResize = () => {
      size()
      seed()
      wake()
    }
    // Reduced motion: no clock, so only redraw when the page moves.
    const onScroll = () => {
      if (still) wake()
    }

    size()
    seed()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [region, layer, fadeBottom])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none fixed inset-0 h-full w-full ${className ?? ''}`} />
}

/* ------------------------------------------------------------------------------------ */
/* Glint                                                                                */
/* ------------------------------------------------------------------------------------ */

/**
 * A narrow band of light that crosses a line drawing every `period` seconds, lighting
 * only its lines (the art is drawn again, light, under a moving mask). Fills its
 * positioned parent, which must be the art's own box.
 */
export function Glint({
  src,
  ratio,
  fit = 'width',
  period,
  delay,
  strength = 0.6,
}: {
  src: string
  ratio: number
  fit?: 'width' | 'height'
  period: number
  delay: number
  strength?: number
}) {
  const mask = 'linear-gradient(105deg, transparent 42%, #000 50%, transparent 58%)'
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        color: '#FFFFFF',
        opacity: strength,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '300% 100%',
        maskSize: '300% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        // Parked off the art: where it rests when motion is reduced.
        WebkitMaskPosition: '100% 0',
        maskPosition: '100% 0',
        animation: `nr-glint ${period}s ease-in-out ${delay}s infinite`,
      }}
    >
      <InkArt src={src} ratio={ratio} fit={fit} />
    </div>
  )
}
