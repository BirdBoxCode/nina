'use client'

import React, { useEffect, useRef } from 'react'

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
  /** Light motes: a hot core in a wide halo, adding up where they overlap. Off for ink
      motes on the paper, which are plain soft specks. */
  glow?: boolean
  /** Strength of the rare four-point flare at a mote's sparkle (0 or omitted: none). */
  flare?: number
}

type Mote = {
  x: number
  y: number
  /** Displacement from its drift path, and its velocity, when something has pushed it. */
  ox: number
  oy: number
  vx: number
  vy: number
  r: number
  a: number
  rise: number
  ph: number
  tw: number
  sprite: number
}

/* Sprites are drawn once and stamped for every mote. */
const canvas2d = (s: number) => {
  const c = document.createElement('canvas')
  c.width = c.height = s
  return { c, g: c.getContext('2d') }
}

/* Light: a small near-white core inside a wide halo of the colour, falling off gently, so
   most of what shows is glow rather than a disc. `soft` 1 drops the core (out of focus). */
function makeGlow(rgb: string, soft: number) {
  const s = 128
  const { c, g } = canvas2d(s)
  if (!g) return c
  const core = 1 - soft
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, `rgba(255, 255, 255, ${(0.25 + 0.75 * core).toFixed(2)})`)
  grad.addColorStop(0.05, `rgba(246, 243, 236, ${(0.2 + 0.7 * core).toFixed(2)})`)
  grad.addColorStop(0.12, `rgba(${rgb}, ${(0.35 + 0.15 * core).toFixed(2)})`)
  grad.addColorStop(0.3, `rgba(${rgb}, .14)`)
  grad.addColorStop(0.55, `rgba(${rgb}, .045)`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return c
}

/* Halo only, no core: a mote seen on the paper, as luminous haze rather than a speck. */
function makeHalo(rgb: string) {
  const s = 128
  const { c, g } = canvas2d(s)
  if (!g) return c
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0, `rgba(${rgb}, .55)`)
  grad.addColorStop(0.2, `rgba(${rgb}, .32)`)
  grad.addColorStop(0.5, `rgba(${rgb}, .1)`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, s, s)
  return c
}

/* Flare: two thin crossed rays, brightest at the centre, for a mote's sparkle. */
function makeFlare() {
  const s = 128
  const { c, g } = canvas2d(s)
  if (!g) return c
  const ray = (horizontal: boolean) => {
    const grad = horizontal ? g.createLinearGradient(0, 0, s, 0) : g.createLinearGradient(0, 0, 0, s)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
    grad.addColorStop(0.5, 'rgba(255, 255, 255, .95)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.fillStyle = grad
    if (horizontal) g.fillRect(0, s / 2 - 1, s, 2)
    else g.fillRect(s / 2 - 1, 0, 2, s)
  }
  ray(true)
  ray(false)
  const glow = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.12)
  glow.addColorStop(0, 'rgba(255, 255, 255, .9)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  g.fillStyle = glow
  g.fillRect(0, 0, s, s)
  return c
}

/* Ink: a plain soft speck, for dust on the paper. */
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

/* How motes answer a moving weapon: the push reaches this far past its box (px), and its
   strength; then a soft spring (stiffness, damping) eases them back onto their path. */
const REPEL = { reach: 60, push: 0.8, carry: 0.6, maxSpeed: 900, minSpeed: 40 }
const SPRING = { k: 3, c: 3 }

/** Motes rising out of the top of their region, as soft haze on the paper above it. */
export type MoteRise = {
  /** How far (px) they climb past the visible edge, where the ground is half turned. */
  above: number
  /** Their colour there, as an rgb triple. */
  color: string
  /** Their strength there, relative to their glow below. */
  alpha: number
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
 *
 * `repel`: wrappers whose first child is draggable art. Only the art's drag offset from
 * its wrapper counts (never the scroll), so motes answer a throw but not the page moving.
 * `rise`: lets the motes carry on up past the region's top, turning to `rise.color` as
 * the ground under them changes, and fading out by `rise.above` px past the visible edge.
 */
export function MoteField({
  region,
  layer,
  fadeTop,
  fadeBottom = 0,
  repel,
  repelStrength = 1,
  rise,
  className,
}: {
  region: React.RefObject<HTMLElement | null>
  layer: MoteLayer
  fadeTop?: () => number
  fadeBottom?: number
  repel?: React.RefObject<HTMLElement | null>[]
  repelStrength?: number
  rise?: MoteRise
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
    const sprites = layer.colors.map((c) => (layer.glow ? makeGlow(c, layer.soft) : makeSprite(c, layer.soft)))
    const darkSprite = rise ? makeHalo(rise.color) : null
    const flare = layer.flare ? makeFlare() : null
    // Light motes add up where they overlap, as light does.
    const blend: GlobalCompositeOperation = layer.glow ? 'lighter' : 'source-over'
    // Each repeller's last drag offset (centre, px) and smoothed velocity (px/s).
    // `tf` is the art's inline transform last frame: reading it costs no layout, so the
    // box is only measured on frames where the art has actually moved.
    const movers = (repel ?? []).map(() => ({
      x: 0, y: 0, vx: 0, vy: 0, seen: false, tf: '',
      box: { l: 0, t: 0, r: 0, b: 0, cx: 0, cy: 0 },
    }))

    let motes: Mote[] = []
    let w = 0
    let h = 0
    let visible = false
    let frame = 0
    const start = performance.now()
    let last = start

    const seed = () => {
      const n = window.innerWidth < 900 ? layer.narrowCount : layer.count
      if (n === motes.length) return
      motes = Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
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

    /* Moving weapons this frame: their screen box and drag velocity. */
    const readMovers = (dt: number) => {
      const out: { l: number; t: number; r: number; b: number; cx: number; cy: number; vx: number; vy: number }[] = []
      repel?.forEach((ref, i) => {
        const wrap = ref.current
        const art = wrap?.firstElementChild as HTMLElement | null | undefined
        if (!wrap || !art) return
        const m = movers[i]
        if (m.seen && art.style.transform === m.tf) {
          // Not moved since last frame: let the velocity die away, and reuse the box.
          m.vx *= 0.6
          m.vy *= 0.6
          if (Math.hypot(m.vx, m.vy) < REPEL.minSpeed) return
          out.push({ ...m.box, vx: m.vx, vy: m.vy })
          return
        }
        m.tf = art.style.transform
        const a = art.getBoundingClientRect()
        const wr = wrap.getBoundingClientRect()
        // Centres, so the hover lift's scale (about the centre) reads as no movement.
        const x = a.left + a.width / 2 - (wr.left + wr.width / 2)
        const y = a.top + a.height / 2 - (wr.top + wr.height / 2)
        if (m.seen && dt > 0) {
          m.vx = m.vx * 0.6 + ((x - m.x) / dt) * 0.4
          m.vy = m.vy * 0.6 + ((y - m.y) / dt) * 0.4
        }
        m.x = x
        m.y = y
        m.seen = true
        m.box = { l: a.left, t: a.top, r: a.right, b: a.bottom, cx: a.left + a.width / 2, cy: a.top + a.height / 2 }
        if (Math.hypot(m.vx, m.vy) < REPEL.minSpeed) return
        out.push({ ...m.box, vx: m.vx, vy: m.vy })
      })
      return out
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const box = region.current?.getBoundingClientRect()
      if (!box || !motes.length) return
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = still ? 0 : (now - start) / 1000
      const ft = fadeTopRef.current?.() ?? 0
      const margin = layer.size[1] * 2 + 20
      const span = h + margin * 2
      const scroll = window.scrollY * layer.parallax
      // With `rise`: up to `rise.above` px past the visible edge (the fade's midpoint).
      const ceiling = rise ? box.top + ft * 0.5 - rise.above : box.top
      const active = still || !repel ? [] : readMovers(dt)
      for (const m of motes) {
        let y = (m.y * span - scroll - m.rise * t) % span
        if (y < 0) y += span
        y -= margin
        let x = m.x * w + Math.sin(t * 0.25 * m.tw + m.ph) * layer.sway

        // Pushed by a moving weapon: away from its centre and along with it, fading out
        // over REPEL.reach past its box. Then the spring brings the mote home.
        if (!still) {
          for (const v of active) {
            const px = x + m.ox
            const py = y + m.oy
            const d = Math.hypot(Math.max(v.l - px, 0, px - v.r), Math.max(v.t - py, 0, py - v.b))
            if (d >= REPEL.reach) continue
            const k = (1 - d / REPEL.reach) * repelStrength
            const dx = px - v.cx
            const dy = py - v.cy
            const len = Math.hypot(dx, dy) || 1
            const speed = Math.min(REPEL.maxSpeed, Math.hypot(v.vx, v.vy))
            const cap = speed / (Math.hypot(v.vx, v.vy) || 1)
            m.vx += ((dx / len) * speed * REPEL.push + v.vx * cap * REPEL.carry) * k * dt
            m.vy += ((dy / len) * speed * REPEL.push + v.vy * cap * REPEL.carry) * k * dt
          }
          if (m.ox || m.oy || m.vx || m.vy) {
            m.vx += (-SPRING.k * m.ox - SPRING.c * m.vx) * dt
            m.vy += (-SPRING.k * m.oy - SPRING.c * m.vy) * dt
            m.ox += m.vx * dt
            m.oy += m.vy * dt
            if (Math.abs(m.ox) + Math.abs(m.oy) + Math.abs(m.vx) + Math.abs(m.vy) < 0.05) m.ox = m.oy = m.vx = m.vy = 0
          }
          x += m.ox
          y += m.oy
        }

        if (y < ceiling - m.r || y > box.bottom + m.r) continue
        // g: how far the ground under the mote has turned to night (1 = fully).
        const g = ft ? smooth(box.top + ft * 0.35, box.top + ft, y) : 1
        const bottom = fadeBottom ? smooth(box.bottom, box.bottom - fadeBottom, y) : 1
        // Twinkle, with a rare sharp glisten on top.
        const tw = 0.55 + 0.45 * Math.sin(t * m.tw + m.ph)
        const glisten = 0.7 * Math.pow(Math.max(0, Math.sin(t * m.tw * 0.37 + m.ph * 2)), 14)
        const lit = m.a * bottom * (tw + glisten)
        const a = Math.min(1, lit * g)
        if (a >= 0.004) {
          ctx.globalCompositeOperation = blend
          ctx.globalAlpha = a
          ctx.drawImage(sprites[m.sprite], x - m.r, y - m.r, m.r * 2, m.r * 2)
          // Shine: a rare, brief four-point flare, on a slower clock than the twinkle so
          // only one or two motes flash at a time.
          if (flare && layer.flare) {
            const s = Math.pow(Math.max(0, Math.sin(t * m.tw * 0.21 + m.ph * 3)), 60)
            if (s > 0.02) {
              const fr = m.r * (0.9 + 0.8 * s)
              ctx.globalAlpha = Math.min(1, s * layer.flare * g * bottom)
              ctx.drawImage(flare, x - fr, y - fr, fr * 2, fr * 2)
            }
          }
        }
        // Above the night: the same mote as a soft halo with no core, climbing the paper
        // as luminous haze and thinning out as it goes.
        if (darkSprite && rise && g < 1) {
          const ad = Math.min(1, lit * rise.alpha * (1 - g) * smooth(ceiling, box.top + ft * 0.15, y))
          if (ad >= 0.004) {
            const hr = m.r * 1.2
            ctx.globalCompositeOperation = 'source-over'
            ctx.globalAlpha = ad
            ctx.drawImage(darkSprite, x - hr, y - hr, hr * 2, hr * 2)
          }
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
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
    // With `rise`, wake that far before the region itself comes on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) {
          last = performance.now()
          wake()
        } else ctx.clearRect(0, 0, w, h)
      },
      { rootMargin: `0px 0px ${Math.round(rise?.above ?? 0)}px 0px` },
    )
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
  }, [region, layer, fadeBottom, repel, repelStrength, rise])

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none fixed inset-0 h-full w-full ${className ?? ''}`} />
}

/* ------------------------------------------------------------------------------------ */
/* Glint                                                                                */
/* ------------------------------------------------------------------------------------ */

/**
 * A narrow band of light that crosses a line drawing every `period` seconds, lighting
 * only its lines. The drawing is a fixed mask (the art file itself) and the band slides
 * under it by transform, which the browser composites without redrawing the art. Fills
 * its positioned parent, which must be the art's own box.
 */
export function Glint({
  src,
  period,
  delay,
  strength = 0.6,
}: {
  src: string
  period: number
  delay: number
  strength?: number
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        opacity: strength,
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 42%, #FFFFFF 50%, transparent 58%)',
          // Parked off the art: where it rests when motion is reduced.
          transform: 'translateX(-100%)',
          willChange: 'transform',
          animation: `nr-glint ${period}s ease-in-out ${delay}s infinite`,
        }}
      />
    </div>
  )
}
