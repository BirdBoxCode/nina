'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion'
import { TransitionLink, useTransitionCovered, REVEAL_CLEAR_DELAY } from '@/components/PageTransition'
import { NavBand, NavCrest, NAV_TRANSITION, navBarPad, navIconOverlay, navIconWidth, useScrolled } from '@/components/SideNav'
import { liftShadow } from '@/lib/utils'

/* Real-3D wordmark; WebGL, so client only. The flat PNG holds the layout until it is drawn. */
const NinaroLogo3D = dynamic(() => import('@/components/NinaroLogo3D').then((m) => m.NinaroLogo3D), {
  ssr: false,
})
const MenuIcons3D = dynamic(() => import('@/components/NinaroLogo3D').then((m) => m.MenuIcons3D), {
  ssr: false,
})
const Crest3D = dynamic(() => import('@/components/NinaroLogo3D').then((m) => m.Crest3D), {
  ssr: false,
})
/* Trial: the hero crest in 3D. false puts the flat crest back. */
const CREST_3D = true

/* Cursor depth on the hero. Each layer shifts by its depth in px at the viewport edge:
   positive follows the cursor (near), negative runs against it (far). Uses the standalone
   `translate` property, which composes with each element's existing transform. */
const depth = (px: number) => `calc(var(--nr-dx, 0) * ${px}px) calc(var(--nr-dy, 0) * ${px}px)`
const DEPTH_EASE = 'translate .9s cubic-bezier(.2,.7,.2,1)'
const DEPTH = { bar: 4, ghost: -24, wings: -10, logo: 8 }
/* Shadows on the paper, by height: the higher the layer, the longer and softer its shadow
   and the further it slides from the cursor, so the layers visibly part. */
const SHADOW = {
  icons: liftShadow(1, 2.5, 2.5, 4, 0.4),
  wings: liftShadow(2, 4, 4, 6, 0.22),
  crest: liftShadow(3, 8, 10, 12, 0.3),
  logo: liftShadow(2, 5, 5, 14, 0.42),
}
const SHADOW_EASE = 'filter .9s cubic-bezier(.2,.7,.2,1)'

/* Play stays up this long after the cursor leaves the wordmark, so the gap to it can be crossed. */
const PLAY_LINGER = 300
/* Menu labels sit at mixed depths (10–22px) so they part from one another in space. */
const labelDepth = (i: number) => 10 + ((i * 5) % 13)

/* --- Design tokens (Nocturne, run on a light paper ground) --- */
const PAPER = '#EFEBE2'
const FRAME = '#E6E1D7'
const INK = '#5C5970'
const MUTED = '#5C5970'
const MUTED_LIGHT = '#7D7A8E'
const DIMMED = '#A5A2B2'
const RULE = '#b2b6ca'
const RULE_LIGHT = '#cfd3e5'
const BORDER = '#dcd8ce'
const ACCENT = '#5d5294'

/* --- Assets. Paths confirmed against /public by checksum against the handoff set. --- */
const ART = {
  ninaro: '/images/assets/ninaro.png',
  ornament: '/images/assets/opera-senza.png',
  icon1: '/images/assets/icons/icon 1.png',
  icon2: '/images/assets/icons/icon 2.png',
  icon3: '/images/assets/icons/icon 3.png',
  menuIcons: '/images/assets/icons/purple-icons.png',
  playIcons: '/images/assets/icons/green-icons.png',
  bull: '/images/assets/components/bull.png',
  dragon: '/images/assets/components/dragon.png',
  shell: '/images/assets/components/shell.png',
  sword: '/images/assets/components/sword.png',
  marking: '/images/assets/components/marking.png',
  marking2: '/images/assets/components/marking-2.png',
  wingLeft: '/images/assets/components/wings-left.png',
  wingRight: '/images/assets/components/wings-right.png',
}

/* Crest/wordmark width; the wings are sized off it so they keep the design's proportion. */
const LOGO_W = 'clamp(140px, 19vw, 300px)'

/* Play group, beside the wordmark and scaled with it so it never runs off a narrow screen.
   The green strip (78×247) is turned to a row: its height is the strip's width. */
const PLAY_ROW_H = `calc(${LOGO_W} * 0.15)`
const PLAY_ROW_W = `calc(${LOGO_W} * 0.15 * 247 / 78)`
const PLAY_TEXT = `clamp(12px, calc(${LOGO_W} * 0.057), 17px)`
const PLAY_GAP = '16px'

/* Wings flank the crest: ~1.75× its width, a small gap off its edge, centred on its
   height (crest art is 1192×1328, so its middle sits at 0.557 of the logo width). */
const WING: React.CSSProperties = {
  position: 'absolute',
  top: `calc(${LOGO_W} * 0.557)`,
  width: `calc(${LOGO_W} * 1.75)`,
  maxWidth: 'none',
  height: 'auto',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
}
const WING_GAP = `calc(100% + ${LOGO_W} * 0.12)`

const EASE = 'cubic-bezier(.2,.7,.2,1)'

/* Load sequence, in seconds from the start: crest, wordmark, its light pass, top bar,
   then the wings unfurl as the finale and the scroll line settles last. */
const LOAD = {
  crest: 0.15,
  wordmark: 0.6,
  sheen: 1.45,
  bar: 1.0,
  wings: 1.3,
  wingStagger: 0.1,
  cue: 2.2,
  done: 2.7,
}
const UNFURL_EASE = 'cubic-bezier(.22,.8,.25,1)'

/* Scroll parallax speeds, relative to the page (1 = moves with it, 0 = holds still). */
const PARALLAX = {
  logo: 1.12,
  wings: 0.6,
  dragon: 0.6,
  sword: 0.2,
}
const MENU_STAGGER = 70

/* How far the logo tilts, in degrees, with the cursor at the far edge of the viewport. */
const LOGO_TILT = 7

/* Crest turn toward a hovered menu label: tilt in degrees and drift in px at full strength.
   CREST_REDUCED scales the tilt for reduced-motion users, who get no drift or sweep. */
const CREST_TILT = 18
const CREST_DRIFT = 24
const CREST_REDUCED = 0.45

/* Menu icons swell toward the cursor: full ICON_GROW scale at the edge, none past ICON_REACH px. */
const ICON_GROW = 0.12
const ICON_REACH = 180

const GRAIN_URL =
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>` +
  `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>` +
  `<feColorMatrix type='saturate' values='0'/></filter>` +
  `<rect width='220' height='220' filter='url(%23n)' opacity='0.34'/></svg>")`

/* Crest-shaped mask for the light layers over the crest. Screen blend lifts the art
   without washing the paper around it, as the wordmark sheen does. */
const CREST_MASK: React.CSSProperties = {
  WebkitMaskImage: `url(${ART.ornament})`,
  maskImage: `url(${ART.ornament})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  mixBlendMode: 'screen',
}

/* Ghost line PNGs are white line art on transparent; invert + multiply reads them dark on paper. */
const GHOST_FILTER: React.CSSProperties = {
  filter: 'invert(1)',
  mixBlendMode: 'multiply',
}

/* Thrown background art may hang this share of itself past the section's edges. */
const DRAG_OVERHANG = 0.6
/* Opacity lift and scale while the art is hovered or held, so it reads as something to pick up. */
const DRAG_LIFT = 2
const DRAG_SCALE = 1.03
/* Only the drawn lines are grabbable. The art's alpha is sampled into a map this wide, and a
   press counts within this many screen px of a line so thin strokes are not fiddly. */
const HIT_MAP_W = 256
const HIT_TOLERANCE = 9
const HIT_ALPHA = 24
/* One loose wobble the first time the art scrolls into view: a hint it can be moved. */
const WOBBLE = [0, -2.2, 1.6, -0.8, 0]

/**
 * Background art the visitor can pick up. Thrown art stays where it lands; with
 * `returnHome` it springs back on release. Only its drawn lines take the pointer, and only
 * where nothing else on the page sits above them.
 */
function DragArt({
  src,
  bounds,
  enabled,
  calm,
  opacity,
  hint,
  returnHome,
  onHot,
  className,
  children,
}: {
  /** The art's image, read for the line-only hit test. */
  src: string
  bounds?: React.RefObject<HTMLDivElement | null>
  enabled: boolean
  /** Reduced motion: no throw momentum, wobble or scale. */
  calm: boolean
  /** Resting opacity; omit when a parent owns it. */
  opacity?: number
  hint?: boolean
  returnHome?: boolean
  onHot?: (hot: boolean) => void
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const labelRef = useRef<HTMLDivElement | null>(null)
  const alpha = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null)
  const heldRef = useRef(false)
  const [hot, setHot] = useState(false)
  const [held, setHeld] = useState(false)
  const controls = useDragControls()
  const rotate = useMotionValue(0)

  useEffect(() => {
    onHot?.(hot)
  }, [hot, onHot])

  // Alpha map for the hit test, read once per image.
  useEffect(() => {
    if (!enabled) return
    let live = true
    const img = new window.Image()
    img.onload = () => {
      if (!live) return
      const w = HIT_MAP_W
      const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      alpha.current = { data: ctx.getImageData(0, 0, w, h).data, w, h }
    }
    img.src = src
    return () => {
      live = false
    }
  }, [enabled, src])

  // Hover is tracked from the window, not the element: its box is mostly empty space, and
  // it only takes pointer events while the cursor is on a line.
  useEffect(() => {
    if (!enabled) return
    let frame = 0
    let last: { x: number; y: number } | null = null

    const onLine = (x: number, y: number) => {
      const el = ref.current
      const map = alpha.current
      if (!el || !map) return false
      const r = el.getBoundingClientRect()
      if (x < r.left - HIT_TOLERANCE || x > r.right + HIT_TOLERANCE) return false
      if (y < r.top - HIT_TOLERANCE || y > r.bottom + HIT_TOLERANCE) return false
      const mx = ((x - r.left) / r.width) * map.w
      const my = ((y - r.top) / r.height) * map.h
      const rad = Math.ceil((HIT_TOLERANCE * map.w) / r.width)
      let found = false
      for (let dy = -rad; dy <= rad && !found; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dy * dy > rad * rad) continue
          const px = Math.round(mx + dx)
          const py = Math.round(my + dy)
          if (px < 0 || py < 0 || px >= map.w || py >= map.h) continue
          if (map.data[(py * map.w + px) * 4 + 3] > HIT_ALPHA) {
            found = true
            break
          }
        }
      }
      if (!found) return false
      // Covered by something else (a card, the heading): leave the pointer to it.
      const top = document.elementFromPoint(x, y)
      return !top || top.contains(el) || el.contains(top)
    }

    const update = () => {
      frame = 0
      if (!last) return
      const label = labelRef.current
      if (label) label.style.transform = `translate(${last.x + 16}px, ${last.y + 18}px)`
      if (!heldRef.current) setHot(onLine(last.x, last.y))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY }
      schedule()
    }
    const onLeave = () => {
      last = null
      if (!heldRef.current) setHot(false)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', schedule)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  // Wobble hint, once, when the art first comes into view.
  useEffect(() => {
    const el = ref.current
    if (!hint || !enabled || calm || !el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        animate(rotate, WOBBLE, { duration: 0.9, ease: 'easeInOut', delay: 0.3 })
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hint, enabled, calm, rotate])

  const lifted = enabled && (hot || held)

  return (
    <>
      <motion.div
        ref={ref}
        className={className}
        drag={enabled}
        dragListener={false}
        dragControls={controls}
        dragConstraints={returnHome ? undefined : bounds}
        dragElastic={0.12}
        dragMomentum={!calm && !returnHome}
        dragSnapToOrigin={returnHome}
        dragTransition={returnHome ? { bounceStiffness: 260, bounceDamping: calm ? 40 : 14 } : undefined}
        // The art is placed partly off-edge by design, so the section-box constraint is
        // widened by DRAG_OVERHANG of its own size rather than snapping it fully inside.
        onMeasureDragConstraints={(c) => {
          const el = ref.current
          if (!el) return
          const w = el.offsetWidth * DRAG_OVERHANG
          const h = el.offsetHeight * DRAG_OVERHANG
          return { left: c.left - w, right: c.right + w, top: c.top - h, bottom: c.bottom + h }
        }}
        onPointerDown={(e) => {
          if (hot) controls.start(e)
        }}
        onDragStart={() => {
          heldRef.current = true
          setHeld(true)
        }}
        onDragEnd={() => {
          heldRef.current = false
          setHeld(false)
        }}
        animate={{ scale: lifted && !calm ? DRAG_SCALE : 1 }}
        transition={{ scale: { duration: 0.4, ease: [0.2, 0.7, 0.2, 1] } }}
        style={{
          rotate,
          opacity: opacity === undefined ? undefined : lifted ? Math.min(1, opacity * DRAG_LIFT) : opacity,
          transition: 'opacity .4s ease',
          pointerEvents: lifted ? 'auto' : 'none',
          cursor: lifted ? (held ? 'grabbing' : 'grab') : undefined,
          touchAction: 'none',
        }}
      >
        {children}
      </motion.div>
      {/* Cursor tag. Portalled: a fixed element inside the transformed art would be placed
          against that transform rather than the viewport. */}
      {enabled &&
        createPortal(
          <div
            ref={labelRef}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[70]"
            style={{ opacity: lifted ? 1 : 0, transition: 'opacity .25s ease' }}
          >
            <span
              className="block rounded-full px-[10px] py-[3px]"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                letterSpacing: '.08em',
                color: INK,
                background: PAPER,
                border: `1px solid ${BORDER}`,
              }}
            >
              Drag
            </span>
          </div>,
          document.body,
        )}
    </>
  )
}

/* marking-2 ships as black line art, unlike the rest of the set; it only needs the multiply. */
const DARK_GHOSTS = new Set<string>([ART.marking2])

const CATS = [
  { label: 'Murals', href: '/walls', left: '25%', top: '21%', rot: 0, ghost: ART.bull },
  { label: 'Paintings', href: '/paintings', left: '20%', top: '36%', rot: 0, ghost: ART.marking },
  { label: 'Illustrations', href: '/illustration', left: '17%', top: '53%', rot: 0, ghost: ART.dragon },
  { label: 'Installations', href: '/installations', left: '18%', top: '68%', rot: 0, ghost: ART.shell },
  { label: 'Stage Design', href: '/stage-design', left: '75%', top: '21%', rot: 0, ghost: ART.marking2 },
  { label: 'Workshops', href: '/workshops', left: '80%', top: '36%', rot: 0, ghost: ART.sword },
  { label: 'About', href: '/bio-contact', left: '83%', top: '53%', rot: 0, ghost: ART.marking },
  { label: 'Shop', href: '/shop', left: '82%', top: '68%', rot: 0, ghost: ART.shell },
] as const

/**
 * Selected work. Titles are placeholders from the design — swap for real project
 * names once the featured set comes from the project data source.
 * `span` carries only the >=900px design spans; below that cards stack 1-up then 2-up.
 */
const WORKS = [
  { title: 'Uroboro', cat: 'Murals', href: '/walls', span: 'min-[900px]:col-span-7', ratio: '4 / 3', mt: undefined, delay: 0 },
  { title: 'Notte Chiara', cat: 'Paintings', href: '/paintings', span: 'min-[900px]:col-span-5', ratio: '3 / 4', mt: 'clamp(0px, 6vw, 92px)', delay: 80 },
  { title: 'Drago', cat: 'Illustration', href: '/illustration', span: 'min-[900px]:col-span-4', ratio: '1 / 1', mt: undefined, delay: 0 },
  { title: 'Soglia', cat: 'Installations', href: '/installations', span: 'min-[900px]:col-span-8', ratio: '16 / 9', mt: 'clamp(0px, 4vw, 58px)', delay: 80 },
  { title: 'Scena Viva', cat: 'Stage design', href: '/stage-design', span: 'min-[900px]:col-start-2 min-[900px]:col-span-5', ratio: '5 / 4', mt: 'clamp(0px, 3vw, 40px)', delay: 0 },
  { title: 'Do Your Own', cat: 'Workshops', href: '/workshops', span: 'min-[900px]:col-span-4', ratio: '3 / 4', mt: 'clamp(0px, 9vw, 150px)', delay: 80 },
]

/**
 * Nav labels: the top bar pair and the footer links, its only users. Neutronic Rounded
 * regular with light tracking; the top bar pair overrides weight and tracking for Bold caps.
 */
const MICRO: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontWeight: 400,
  fontSize: '18px',
  letterSpacing: '.06em',
}

/**
 * Scroll fade-ups. Anything at or above the fold on mount reveals immediately so a
 * mid-page refresh is never blank; a scroll pass flushes anything the observer missed
 * on a fast jump. No IntersectionObserver reveals everything.
 */
function useReveal() {
  const nodes = useRef<Map<number, HTMLElement>>(new Map())
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set())

  const register = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      if (el) nodes.current.set(i, el)
      else nodes.current.delete(i)
    },
    []
  )

  useEffect(() => {
    const current = nodes.current
    const show = (i: number) =>
      setRevealed((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))

    if (!('IntersectionObserver' in window)) {
      setRevealed(new Set(current.keys()))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const i = Number((e.target as HTMLElement).dataset.revealIndex)
          show(i)
          io.unobserve(e.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )

    const flush = () => {
      current.forEach((el, i) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          show(i)
          io.unobserve(el)
        }
      })
    }

    current.forEach((el) => io.observe(el))
    flush()
    window.addEventListener('scroll', flush, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', flush)
    }
  }, [])

  /** Inline style for reveal target `i`: `dur` seconds, `travel` px, optional ms delay. */
  const revealStyle = (
    i: number,
    dur: number,
    travel: number,
    delay = 0
  ): React.CSSProperties => ({
    opacity: revealed.has(i) ? 1 : 0,
    transform: revealed.has(i) ? 'none' : `translateY(${travel}px)`,
    transition: `opacity ${dur}s ${EASE} ${delay}ms, transform ${dur}s ${EASE} ${delay}ms`,
  })

  return { register, revealStyle }
}

export function NinaroHome() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  // Which illustration is painted, held apart from whether it is visible: on mouse-out
  // `hover` clears immediately, so reading the src off it would swap the image mid-fade.
  const [ghostSrc, setGhostSrc] = useState<string>(ART.marking)
  // Derived, not stored: ghostSrc outlives `hover` through the fade, and so must the polarity.
  const ghostDark = DARK_GHOSTS.has(ghostSrc)
  const [near, setNear] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [nudge, setNudge] = useState<readonly number[]>(() => CATS.map(() => 0))
  // Where the hover ghost sits: bottom-anchored just above the logo, capped to the room
  // between the top bar and the logo, and to the corridor the scattered labels leave open.
  const [ghostBox, setGhostBox] = useState<
    { bottom: number; maxHeight: number; maxWidth: number | null } | null
  >(null)
  // Cursor offset from the logo centre, normalised to -1..1 per axis. Drives both the
  // parallax drift and where the sheen falls, so the two always agree.
  const [glide, setGlide] = useState({ x: 0, y: 0 })
  // 0..1 — how close the cursor is to the menu icons; 1 is touching.
  const [iconNear, setIconNear] = useState(0)
  const iconsRef = useRef<HTMLSpanElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)
  // Parallax layers, moved directly from a scroll frame (no re-render per frame).
  const logoParRef = useRef<HTMLDivElement | null>(null)
  const wingsParRef = useRef<HTMLDivElement | null>(null)
  const workRef = useRef<HTMLElement | null>(null)
  const dragonRef = useRef<HTMLDivElement | null>(null)
  const swordRef = useRef<HTMLDivElement | null>(null)
  // Clip layer for the work-section art; also the bounds the art can be thrown within.
  const artLayerRef = useRef<HTMLDivElement | null>(null)
  // Mouse/trackpad only: on touch a drag would fight the page scroll.
  const [canDrag, setCanDrag] = useState(false)
  // Hero wings brighten while one is under the cursor or held.
  const [wingHot, setWingHot] = useState({ left: false, right: false })
  const onLeftWingHot = useCallback((hot: boolean) => setWingHot((w) => (w.left === hot ? w : { ...w, left: hot })), [])
  const onRightWingHot = useCallback((hot: boolean) => setWingHot((w) => (w.right === hot ? w : { ...w, right: hot })), [])
  // The 3D wordmark replaces the flat one once it has drawn its first frame.
  const [logo3dReady, setLogo3dReady] = useState(false)
  const onLogo3dReady = useCallback(() => setLogo3dReady(true), [])
  const [icons3dReady, setIcons3dReady] = useState(false)
  const onIcons3dReady = useCallback(() => setIcons3dReady(true), [])
  const [crest3dReady, setCrest3dReady] = useState(false)
  const onCrest3dReady = useCallback(() => setCrest3dReady(true), [])
  const heroRef = useRef<HTMLElement | null>(null)
  // Crest aim: unit vector from the crest's centre to the hovered label's centre.
  const crestRef = useRef<HTMLDivElement | null>(null)
  const sweepRef = useRef<HTMLDivElement | null>(null)
  const [aim, setAim] = useState({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const { register, revealStyle } = useReveal()
  // Arriving via the page wipe mounts this page hidden, so the load sequence waits for
  // the panel to clear. Captured once at mount so it never re-triggers.
  const covered = useTransitionCovered()
  const [loadDelay] = useState(() => (covered ? REVEAL_CLEAR_DELAY : 0))
  const at = (t: number) => `${(loadDelay + t).toFixed(2)}s`
  // Logo hover (Play reveal, wing fade) holds off until the sequence has played out.
  const [loaded, setLoaded] = useState(false)
  // Play opens on the wordmark only (Play sits inside it); leaving closes it after
  // PLAY_LINGER, cancelled if the cursor comes back in time.
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showPlay = useCallback(() => {
    if (playTimer.current) clearTimeout(playTimer.current)
    playTimer.current = null
    if (loaded) setNear(true)
  }, [loaded])
  const hidePlay = useCallback(() => {
    if (playTimer.current) clearTimeout(playTimer.current)
    playTimer.current = setTimeout(() => setNear(false), PLAY_LINGER)
  }, [])
  useEffect(
    () => () => {
      if (playTimer.current) clearTimeout(playTimer.current)
    },
    [],
  )
  const scrolled = useScrolled()
  // The hero's own logo covers the crest's job until most of the hero has scrolled away.
  const pastHero = useScrolled(() => window.innerHeight * 0.75)

  // Below ~900px the scattered menu stacks into a centred column (same stagger).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Logo parallax. The transform lands on an inner wrapper, never on logoRef itself:
  // nr-fadeup fills `both`, so its final `transform: none` would outrank an inline
  // transform, and logoRef's box is the resting geometry the collision measure reads.
  useEffect(() => {
    // Touch devices only fire pointermove mid-drag, and the reduced-motion CSS at
    // globals.css:80 cannot reach a transform written from JS — so both are gated here.
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = logoRef.current?.getBoundingClientRect()
        if (!box) return
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        // Normalised against the viewport half-extent, so the drift reads the same
        // whether the cursor crosses a laptop screen or an ultrawide.
        const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)))
        const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)))
        setGlide((prev) =>
          Math.abs(prev.x - nx) < 0.005 && Math.abs(prev.y - ny) < 0.005 ? prev : { x: nx, y: ny },
        )
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  // Menu icon proximity. Measured off the unscaled wrapper span, so the scale applied to
  // the image inside never feeds back into the distance. Same gating as the logo tilt.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = iconsRef.current?.getBoundingClientRect()
        if (!box) return
        // Distance to the nearest point of the icon column, 0 when inside it.
        const dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right)
        const dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom)
        const t = Math.max(0, 1 - Math.hypot(dx, dy) / ICON_REACH)
        setIconNear((prev) => (Math.abs(prev - t) < 0.01 ? prev : t))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = () => {
      setMenuOpen(false)
      setHover(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    // Anything that is not a menu label dismisses. The menu button is excluded: this
    // fires on pointerdown, so closing there would only be undone by the button's click.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-nr-item]')) return
      if (menuBtnRef.current?.contains(target)) return
      close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  const toggleMenu = () => {
    setHover(null)
    // The scattered labels live in the hero, so opening from further down the page
    // first glides back to the top, then opens once the hero is in view.
    if (menuOpen || window.scrollY < 4) {
      setMenuOpen((o) => !o)
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    const start = performance.now()
    const wait = () => {
      if (window.scrollY < 4 || performance.now() - start > 1500) setMenuOpen(true)
      else requestAnimationFrame(wait)
    }
    requestAnimationFrame(wait)
  }

  // On narrow screens the stacked menu would sit on top of the logo, so the centre
  // cluster steps aside while it is open. Desktop keeps the logo visible as designed.
  const centreHidden = narrow && menuOpen

  // The crest leaves the cursor and turns to the hovered label. Desktop only: narrow
  // screens hide the centre cluster while the menu is open.
  const aiming = menuOpen && hover !== null && !narrow

  const aimAt = (el: HTMLElement) => {
    const crest = crestRef.current?.getBoundingClientRect()
    if (!crest) return
    const label = el.getBoundingClientRect()
    const dx = label.left + label.width / 2 - (crest.left + crest.width / 2)
    const dy = label.top + label.height / 2 - (crest.top + crest.height / 2)
    const len = Math.hypot(dx, dy) || 1
    setAim({ x: dx / len, y: dy / len })
  }

  // Hero cursor depth: writes -1..1 to CSS variables on the hero (no re-render per move).
  // Same gating as the logo tilt; past the hero the layers settle back to rest.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const hero = heroRef.current
        if (!hero) return
        const away = window.scrollY > window.innerHeight
        const nx = away ? 0 : (e.clientX / window.innerWidth) * 2 - 1
        const ny = away ? 0 : (e.clientY / window.innerHeight) * 2 - 1
        hero.style.setProperty('--nr-dx', nx.toFixed(3))
        hero.style.setProperty('--nr-dy', ny.toFixed(3))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanDrag(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Scroll parallax. Each layer's speed is relative to the page: 1 moves with it, 0 holds
  // still on screen. Transforms are written straight to the nodes once per frame.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const apply = () => {
      frame = 0
      const vh = window.innerHeight
      // Phones get a gentler hero separation.
      const soft = window.innerWidth < 900 ? 0.6 : 1
      const set = (el: HTMLElement | null, y: number) => {
        if (el) el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
      }

      // Hero: only while it is on screen.
      const hy = Math.min(window.scrollY, vh * 1.2)
      set(logoParRef.current, -hy * (PARALLAX.logo - 1) * soft)
      set(wingsParRef.current, hy * (1 - PARALLAX.wings) * soft)

      // Selected work. A layer at speed s lags the page by (1 - s) of the distance
      // scrolled past its anchor: both are anchored to the section entering at the
      // bottom, so they only drift down and never rise past the section's top edge.
      const top = workRef.current?.getBoundingClientRect().top
      if (top === undefined) return
      set(dragonRef.current, (1 - PARALLAX.dragon) * (vh - top))
      set(swordRef.current, (1 - PARALLAX.sword) * (vh - top))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), (loadDelay + LOAD.done) * 1000)
    return () => clearTimeout(id)
  }, [loadDelay])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Shimmer sweep across the crest while it is aimed. Driven through the Web Animations
  // API so the loop needs no new keyframes in globals.css.
  useEffect(() => {
    const el = sweepRef.current
    if (!el || !aiming || reducedMotion) return
    const run = el.animate(
      [{ backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0' }],
      { duration: 1600, iterations: Infinity, easing: 'ease-in-out' },
    )
    return () => run.cancel()
  }, [aiming, reducedMotion])

  // The scattered labels sit on a fixed percentage grid, so at some viewport sizes one
  // lands on the logo. Measure and push only the labels that actually collide outward;
  // the designed scatter is untouched wherever it already fits. Narrow screens stack the
  // menu and hide the centre cluster, so there is nothing to clear there.
  useEffect(() => {
    const GUTTER = 20
    const EDGE = 12
    const GHOST_GAP = 48

    const measure = () => {
      const logo = logoRef.current
      const layer = layerRef.current
      if (narrow || !logo || !layer) {
        setNudge((prev) => (prev.some((d) => d !== 0) ? CATS.map(() => 0) : prev))
        setGhostBox(null)
        return
      }

      const box = logo.getBoundingClientRect()
      const origin = layer.getBoundingClientRect()
      const next = CATS.map(() => 0)
      const labels: { i: number; left: number; right: number; top: number; bottom: number }[] = []

      layer.querySelectorAll<HTMLElement>('[data-nr-item]').forEach((el) => {
        // Offset geometry is the resting position: it ignores the transform, so a nudge
        // already applied — or one mid-transition — never feeds back into the next pass.
        const left = origin.left + el.offsetLeft - el.offsetWidth / 2
        const right = left + el.offsetWidth
        const top = origin.top + el.offsetTop - el.offsetHeight / 2
        const bottom = top + el.offsetHeight
        labels.push({ i: Number(el.dataset.nrItem), left, right, top, bottom })
        if (bottom <= box.top - GUTTER || top >= box.bottom + GUTTER) return
        if (right <= box.left - GUTTER || left >= box.right + GUTTER) return

        // Clear it past the nearer edge of the logo, then keep it inside the viewport.
        let dx =
          (left + right) / 2 < (box.left + box.right) / 2
            ? box.left - GUTTER - right
            : box.right + GUTTER - left
        if (left + dx < EDGE) dx = EDGE - left
        if (right + dx > window.innerWidth - EDGE) dx = window.innerWidth - EDGE - right
        next[Number(el.dataset.nrItem)] = Math.round(dx)
      })

      setNudge((prev) => (prev.every((d, i) => d === next[i]) ? prev : next))

      // Clear the logo vertically as well: pin the art's bottom edge GHOST_GAP above the
      // logo's top, and fit it into the band above. The band runs to the hero's top edge,
      // not the top bar's: the bar's items sit in the corners, clear of the centred art,
      // and its tall icon column would otherwise squeeze the band shut.
      const bandTop = origin.top + GUTTER
      const bandBottom = box.top - GHOST_GAP
      const bottom = Math.round(origin.bottom - box.top + GHOST_GAP)
      const maxHeight = Math.max(0, Math.round(bandBottom - bandTop))

      // Widest the art can be without reaching a label that shares its band. The art is
      // centred on the layer, so the tighter side sets a symmetric cap.
      const centre = origin.left + origin.width / 2
      let leftLimit = -Infinity
      let rightLimit = Infinity
      labels.forEach((l) => {
        const dx = next[l.i]
        if (l.bottom <= bandTop || l.top >= bandBottom) return
        if ((l.left + l.right) / 2 < centre) leftLimit = Math.max(leftLimit, l.right + dx)
        else rightLimit = Math.min(rightLimit, l.left + dx)
      })
      const half = Math.min(centre - leftLimit, rightLimit - centre) - GUTTER
      const maxWidth = Number.isFinite(half) ? Math.max(0, Math.round(half * 2)) : null

      setGhostBox((prev) =>
        prev && prev.bottom === bottom && prev.maxHeight === maxHeight && prev.maxWidth === maxWidth
          ? prev
          : { bottom, maxHeight, maxWidth },
      )
    }

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    schedule()
    // Web fonts land after first paint and change the label widths.
    document.fonts?.ready.then(schedule).catch(() => {})
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
    }
  }, [narrow])

  return (
    <div
      className="nr-home relative min-h-screen overflow-x-hidden font-sans font-normal"
      style={{ background: PAPER, color: INK }}
    >
      {/* Grain — page level, above everything but the cursor and page transition */}
      <div
        aria-hidden="true"
        className="fixed inset-[-10%] z-[60] pointer-events-none"
        style={{
          opacity: 0.5,
          mixBlendMode: 'multiply',
          animation: 'nr-grain 9s ease-in-out infinite alternate',
          backgroundImage: GRAIN_URL,
        }}
      />

      {/* ===== Hero ===== */}
      <section ref={heroRef} className="relative flex items-center justify-center h-screen min-h-[560px]">
        {/* Top bar — fixed; compacts onto a paper band once the page scrolls. The bar
            itself lets clicks through so its box never blocks the content below. */}
        <div
          // items-start: the menu icon column grows tall on desktop, so top-aligning
          // keeps TATTOO near the top rather than centred on the column.
          className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex items-start justify-between px-[34px]"
          style={{
            paddingTop: navBarPad(scrolled),
            translate: depth(DEPTH.bar),
            transition: `padding-top ${NAV_TRANSITION}, ${DEPTH_EASE}`,
          }}
        >
          <NavBand show={scrolled} />
          <NavCrest compact show={pastHero && !menuOpen} />
          <button
            ref={menuBtnRef}
            type="button"
            onClick={toggleMenu}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="pointer-events-auto relative flex items-start gap-3 bg-transparent border-0 p-1.5 cursor-pointer"
            style={{ animation: `nr-bar-in .9s ${EASE} ${at(LOAD.bar)} both` }}
          >
            {/* Icon column, sized off the logo width to keep the design's proportion */}
            <span ref={iconsRef} className="relative block" aria-hidden="true">
              <Image
                src={ART.menuIcons}
                alt=""
                width={77}
                height={247}
                className="block h-auto"
                style={{
                  width: navIconWidth(scrolled),
                  transform: `scale(${(1 + iconNear * ICON_GROW).toFixed(3)})`,
                  opacity: icons3dReady ? 0 : 1,
                  transition: `width ${NAV_TRANSITION}, transform .5s ${EASE}, opacity .6s ease`,
                }}
              />
              {/* 3D icons over the flat ones; scaled (never resized) to track the compact bar. */}
              <span className="block" style={navIconOverlay(scrolled, 1 + iconNear * ICON_GROW)}>
                <MenuIcons3D visible={icons3dReady} shadow={SHADOW.icons} onReady={onIcons3dReady} />
              </span>
            </span>
          </button>

          <a
            href="https://lineacruda.com"
            target="_blank"
            rel="noopener"
            className="pointer-events-auto relative flex items-center gap-3 p-1.5"
            style={{ animation: `nr-bar-in .9s ${EASE} ${at(LOAD.bar + 0.08)} both` }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: MUTED }}>Tattoo</span>
            <Image src={ART.icon2} alt="" width={26} height={26} className="w-[26px] h-[26px]" aria-hidden="true" />
          </a>
        </div>

        {/* Centre cluster — hovering the wordmark reveals the game entry beside it */}
        <div
          className="relative z-20 flex items-center py-10"
          style={{
            gap: 'clamp(24px, 5vw, 76px)',
            opacity: centreHidden ? 0 : 1,
            pointerEvents: centreHidden ? 'none' : 'auto',
            transition: 'opacity .5s ease',
          }}
        >
          {/* Logo block */}
          <div
            ref={logoRef}
            className="relative text-center"
          >
            {/* Wings — outside the tilt plane so they stay still, and positioned out of
                flow so logoRef's box (read by the collision measure) is unchanged. */}
            {/* Wings parallax — trails the page, so the logo lifts away from them on scroll */}
            <div ref={wingsParRef} style={{ willChange: 'transform' }}>
            <div
              aria-hidden="true"
              style={{
                opacity: wingHot.left || wingHot.right ? 0.9 : menuOpen ? 0.2 : near ? 0.3 : 0.7,
                translate: depth(DEPTH.wings),
                transition: `opacity .5s ease, ${DEPTH_EASE}`,
              }}
            >
              {/* Each wing can be picked up and springs home on release. The drag lives on
                  a wrapper so it never meets the unfurl animation on the image. */}
              <div style={{ ...WING, right: WING_GAP, filter: SHADOW.wings, transition: SHADOW_EASE }}>
                <DragArt src={ART.wingLeft} enabled={canDrag} calm={reducedMotion} returnHome onHot={onLeftWingHot}>
                  <Image
                    src={ART.wingLeft}
                    alt=""
                    width={1009}
                    height={355}
                    priority
                    draggable={false}
                    className="block h-auto w-full"
                    style={{ animation: `nr-unfurl-left 1.4s ${UNFURL_EASE} ${at(LOAD.wings)} both` }}
                  />
                </DragArt>
              </div>
              <div style={{ ...WING, left: WING_GAP, filter: SHADOW.wings, transition: SHADOW_EASE }}>
                <DragArt src={ART.wingRight} enabled={canDrag} calm={reducedMotion} returnHome onHot={onRightWingHot}>
                  <Image
                    src={ART.wingRight}
                    alt=""
                    width={1007}
                    height={353}
                    priority
                    draggable={false}
                    className="block h-auto w-full"
                    style={{ animation: `nr-unfurl-right 1.4s ${UNFURL_EASE} ${at(LOAD.wings + LOAD.wingStagger)} both` }}
                  />
                </DragArt>
              </div>
            </div>
            </div>
            {/* Logo parallax — runs a touch ahead of the page so it pulls away from the wings */}
            <div ref={logoParRef} style={{ willChange: 'transform' }}>
            <div
              style={{
                // Position is pinned; only the plane turns. rotateY(+x) pushes the right
                // edge back and rotateX(-y) the top, so the wordmark faces the cursor.
                transform:
                  `perspective(900px) ` +
                  `rotateX(${(-glide.y * LOGO_TILT).toFixed(2)}deg) ` +
                  `rotateY(${(glide.x * LOGO_TILT).toFixed(2)}deg)`,
                translate: depth(DEPTH.logo),
                transition: `transform .5s ${EASE}, ${DEPTH_EASE}`,
                willChange: 'transform',
              }}
            >
              {/* Opera senza crest — sits inside the tilt plane so it turns with the
                  wordmark, and is width-matched to it (same clamp as the wordmark). */}
              {/* Entrance lives on its own wrapper: the crest's aim is an inline transform,
                  which a `both`-filled animation on the same element would pin. */}
              <div style={{ animation: `nr-crest-in 1.2s ${EASE} ${at(LOAD.crest)} both` }}>
              <div
                ref={crestRef}
                data-transition-crest
                className="relative mx-auto"
                style={{
                  width: LOGO_W,
                  marginBottom: 'clamp(10px, 1.5vw, 22px)',
                  // While aimed, turn to the label and drift toward it. The parent plane
                  // still tilts with the cursor, so its share is subtracted: the crest's
                  // net turn is the label aim alone.
                  transform: aiming
                    ? `translate(${(reducedMotion ? 0 : aim.x * CREST_DRIFT).toFixed(1)}px, ` +
                      `${(reducedMotion ? 0 : aim.y * CREST_DRIFT).toFixed(1)}px) ` +
                      `perspective(900px) ` +
                      `rotateX(${(-aim.y * CREST_TILT * (reducedMotion ? CREST_REDUCED : 1) + glide.y * LOGO_TILT).toFixed(2)}deg) ` +
                      `rotateY(${(aim.x * CREST_TILT * (reducedMotion ? CREST_REDUCED : 1) - glide.x * LOGO_TILT).toFixed(2)}deg)`
                    : 'none',
                  filter: SHADOW.crest,
                  transition: `transform .8s ${EASE}, ${SHADOW_EASE}`,
                }}
              >
                <Image
                  src={ART.ornament}
                  alt=""
                  width={1192}
                  height={1328}
                  priority
                  className="block h-auto w-full"
                  style={{ opacity: CREST_3D && crest3dReady ? 0 : 1, transition: 'opacity .6s ease' }}
                />
                {/* 3D crest over the flat one, inside the aim plane and under the crest's
                    shadow; the PNG keeps the layout box and stays as the fallback. */}
                {CREST_3D && !reducedMotion && (
                  <Crest3D glide={glide} visible={crest3dReady} onReady={onCrest3dReady} />
                )}
                {/* Light on the side facing the label. Masked by the crest itself, like
                    the wordmark sheen, so it falls on the artwork, not a box around it. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    ...CREST_MASK,
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,0) 55%)',
                    backgroundSize: '170% 170%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `${(50 + aim.x * 50).toFixed(1)}% ${(50 + aim.y * 50).toFixed(1)}%`,
                    opacity: aiming ? 1 : 0,
                    transition: `opacity .6s ease, background-position .8s ${EASE}`,
                  }}
                />
                {/* Shimmer: a soft band of light that sweeps across while aimed */}
                <div
                  ref={sweepRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    ...CREST_MASK,
                    backgroundImage:
                      'linear-gradient(105deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.5) 50%, rgba(255,255,255,0) 62%)',
                    backgroundSize: '250% 100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '100% 0',
                    opacity: aiming && !reducedMotion ? 1 : 0,
                    transition: 'opacity .6s ease',
                  }}
                />
              </div>
              </div>
              <div
                className="relative inline-block"
                // Play sits inside this wrapper, so hovering it counts as hovering the
                // wordmark; the linger covers the small gap between the two.
                onMouseEnter={showPlay}
                onMouseLeave={hidePlay}
                style={{ animation: `nr-fadeup 1s ${EASE} ${at(LOAD.wordmark)} both`, cursor: 'pointer' }}
              >
                {/* Game entry — the game itself is a later phase, so this goes nowhere yet */}
                <a
                  href="#game"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Enter the game"
                  aria-hidden={!near}
                  tabIndex={near ? 0 : -1}
                  className="absolute top-1/2 z-[1] flex items-center gap-2.5 no-underline"
                  style={{
                    right: `calc(100% + ${PLAY_GAP})`,
                    cursor: 'pointer',
                    opacity: near ? 1 : 0,
                    transform: near ? 'translateY(-50%)' : 'translateY(calc(-50% + 10px))',
                    pointerEvents: near ? 'auto' : 'none',
                    transition: `opacity .55s ease, transform .7s ${EASE}`,
                  }}
                >
                  <span className="relative block shrink-0" style={{ width: PLAY_ROW_W, height: PLAY_ROW_H }}>
                    <Image
                      src={ART.playIcons}
                      alt=""
                      width={78}
                      height={247}
                      className="absolute left-1/2 top-1/2 block h-auto max-w-none"
                      style={{ width: PLAY_ROW_H, transform: 'translate(-50%, -50%) rotate(-90deg)' }}
                    />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 400,
                      fontSize: PLAY_TEXT,
                      letterSpacing: '.08em',
                      color: MUTED,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Play
                  </span>
                </a>
                <Image
                  src={ART.ninaro}
                  alt="NINARÒ"
                  width={1252}
                  height={463}
                  priority
                  className="block h-auto"
                  style={{ width: LOGO_W, opacity: logo3dReady ? 0 : 1, transition: 'opacity .6s ease' }}
                />
                {/* Real-3D wordmark over the flat one; the PNG stays as the fallback (no
                    WebGL, reduced motion) and keeps the layout box either way. */}
                {!reducedMotion && (
                  <NinaroLogo3D glide={glide} visible={logo3dReady} shadow={SHADOW.logo} onReady={onLogo3dReady} />
                )}
              </div>
            </div>
            </div>
          </div>

        </div>

        {/* Scattered menu layer */}
        <div
          ref={layerRef}
          className="absolute inset-0"
          style={{
            zIndex: menuOpen ? 25 : 5,
            pointerEvents: menuOpen ? 'auto' : 'none',
          }}
        >
          {/* Hover ghost — a background image, so no request fires for an unresolved value */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 pointer-events-none"
            style={{
              width: 'min(46vh, 50vw)',
              height: 'min(46vh, 50vw)',
              ...(ghostBox
                ? {
                    bottom: ghostBox.bottom,
                    maxHeight: ghostBox.maxHeight,
                    ...(ghostBox.maxWidth !== null ? { maxWidth: ghostBox.maxWidth } : null),
                  }
                : { top: '50%' }),
              transform: ghostBox
                ? `translateX(-50%) scale(${hover !== null ? 1 : 0.94})`
                : `translate(-50%,-50%) scale(${hover !== null ? 1 : 0.94})`,
              transformOrigin: ghostBox ? 'center bottom' : 'center',
              backgroundImage: `url(${ghostSrc})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: ghostBox ? 'center bottom' : 'center',
              backgroundSize: 'contain',
              opacity: menuOpen && hover !== null ? 0.3 : 0,
              translate: depth(DEPTH.ghost),
              transition: `opacity .8s ease, transform 1.2s ${EASE}, ${DEPTH_EASE}`,
              ...(ghostDark ? { mixBlendMode: 'multiply' as const } : GHOST_FILTER),
            }}
          />

          {CATS.map((c, i) => {
            const external = c.href.startsWith('http')
            const style: React.CSSProperties = {
              position: 'absolute',
              left: narrow ? '50%' : c.left,
              // Stacked: a 6% step tightens the column, and the 26% start keeps the
              // 9-item span (48%) centred in the hero.
              top: narrow ? `${26 + i * 6}%` : c.top,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(19px, 1.9vw, 29px)',
              // Open enough to breathe while the script still joins; the hover widening
              // is the original gesture rescaled to this baseline, not a new one.
              letterSpacing: hover === i ? '.11em' : '.07em',
              fontWeight: 400,
              whiteSpace: 'nowrap',
              color: hover === i ? ACCENT : hover === null ? INK : DIMMED,
              transform:
                `translate(-50%,-50%) translateX(${nudge[i] ?? 0}px) ` +
                `rotate(${narrow ? 0 : c.rot}deg) translateY(${menuOpen ? '0px' : '16px'})`,
              opacity: menuOpen ? 1 : 0,
              transition:
                `opacity .7s ${EASE} ${i * MENU_STAGGER}ms, ` +
                `transform .9s ${EASE} ${i * MENU_STAGGER}ms, ` +
                `color .4s ease, letter-spacing .4s ease, ${DEPTH_EASE}`,
              translate: depth(labelDepth(i)),
            }
            const shared = {
              style,
              'data-nr-item': i,
              tabIndex: menuOpen ? 0 : -1,
              'aria-hidden': !menuOpen,
              onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
                setHover(i)
                setGhostSrc(c.ghost)
                aimAt(e.currentTarget)
              },
              onMouseLeave: () => setHover(null),
            }

            return external ? (
              <a key={c.label} href={c.href} target="_blank" rel="noopener" {...shared}>
                {c.label}
              </a>
            ) : (
              <TransitionLink key={c.label} href={c.href} {...shared}>
                {c.label}
              </TransitionLink>
            )
          })}
        </div>

        {/* Scroll cue */}
        <div
          className="absolute left-1/2 bottom-[34px] -translate-x-1/2 z-20 flex flex-col items-center gap-[9px]"
          style={{
            animation: `nr-fadeup 1.2s ease ${at(LOAD.cue)} both`,
            opacity: centreHidden ? 0 : undefined,
            transition: 'opacity .5s ease',
          }}
        >
          <span
            className="w-px h-[34px]"
            style={{
              background: `linear-gradient(to bottom, ${RULE}, transparent)`,
              animation: 'nr-cue 2.6s ease-in-out infinite',
            }}
          />
        </div>
      </section>

      {/* ===== Selected work ===== */}
      <section
        ref={workRef}
        // isolate: the illustration layer sits at z -1, behind the cards but above the paper.
        className="relative isolate mx-auto max-w-[1500px]"
        style={{ padding: 'clamp(60px, 9vw, 130px) clamp(22px, 5vw, 84px) 130px' }}
      >
        {/* Background illustrations — full-bleed past the section's max width, clipped to
            its height, each drifting at its own speed (see the parallax effect). */}
        <div
          ref={artLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-[-1] w-screen -translate-x-1/2 overflow-hidden"
          // Soft top edge: art meeting the clip fades into the paper instead of a hard cut.
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 120px)',
            maskImage: 'linear-gradient(to bottom, transparent 0, #000 120px)',
          }}
        >
          <div
            ref={dragonRef}
            className="absolute"
            style={{ top: 'clamp(40px, 6vw, 110px)', left: '-4vw', width: '40vw', willChange: 'transform' }}
          >
            {/* Drag sits inside the parallax node: the scroll effect writes that node's
                transform directly, so the two offsets add instead of overwriting. */}
            <DragArt src={ART.dragon} bounds={artLayerRef} enabled={canDrag} calm={reducedMotion} opacity={0.14} hint>
              <Image src={ART.dragon} alt="" width={1200} height={698} draggable={false} className="block h-auto w-full" style={GHOST_FILTER} />
            </DragArt>
          </div>
          <div
            ref={swordRef}
            className="absolute top-0"
            style={{ right: '-4vw', height: narrow ? '60vh' : '90vh', willChange: 'transform' }}
          >
            <DragArt src={ART.sword} bounds={artLayerRef} enabled={canDrag} calm={reducedMotion} opacity={0.16} hint className="h-full">
              <Image src={ART.sword} alt="" width={494} height={1200} draggable={false} className="block h-full w-auto" style={GHOST_FILTER} />
            </DragArt>
          </div>
        </div>

        <div
          ref={register(0)}
          data-reveal-index={0}
          className="flex items-baseline gap-[18px]"
          style={{ marginBottom: 'clamp(38px, 5vw, 70px)', ...revealStyle(0, 1.1, 22) }}
        >
          <h2
            className="m-0"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(32px, 3.4vw, 46px)',
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: INK,
            }}
          >
            Selected work
          </h2>
          <span
            className="flex-1 h-px"
            style={{ background: `linear-gradient(to right, ${RULE_LIGHT} 0 60%, transparent)` }}
          />
          <span style={{ fontSize: '10.5px', letterSpacing: '.24em', textTransform: 'uppercase', color: MUTED_LIGHT }}>
            2021 — 2026
          </span>
        </div>

        <div
          className="grid grid-cols-12"
          style={{ gap: 'clamp(20px, 3vw, 56px) clamp(20px, 2.6vw, 44px)' }}
        >
          {WORKS.map((w, i) => (
            <div
              key={w.title}
              ref={register(i + 1)}
              data-reveal-index={i + 1}
              className={`col-span-12 min-[640px]:col-span-6 ${w.span}`}
              style={{ marginTop: w.mt, ...revealStyle(i + 1, 1.2, 30, w.delay) }}
            >
              <TransitionLink href={w.href} className="group block">
                {/* Frame stays an empty placeholder until real project photography lands */}
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: w.ratio, background: FRAME }}
                />
                <div className="flex items-baseline justify-between gap-4 pt-[13px]">
                  <span
                    className="transition-colors duration-300 group-hover:text-[#5d5294]"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 700,
                      fontSize: '28px',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {w.title}
                  </span>
                  <span style={{ fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', color: MUTED_LIGHT }}>
                    {w.cat}
                  </span>
                </div>
              </TransitionLink>
            </div>
          ))}
        </div>

        <div
          ref={register(WORKS.length + 1)}
          data-reveal-index={WORKS.length + 1}
          className="flex flex-wrap items-center justify-between gap-6 pt-[26px]"
          style={{
            marginTop: 'clamp(70px, 9vw, 140px)',
            borderTop: `1px solid ${BORDER}`,
            ...revealStyle(WORKS.length + 1, 1.1, 22),
          }}
        >
          <Image
            src={ART.ninaro}
            alt="NINARÒ"
            width={1252}
            height={463}
            className="block h-auto"
            style={{ width: 'clamp(78px, 8vw, 104px)' }}
          />
          <div className="flex gap-7">
            <TransitionLink href="/bio-contact" className="hover:text-[#5d5294]" style={MICRO}>
              About
            </TransitionLink>
            <TransitionLink href="/shop" className="hover:text-[#5d5294]" style={MICRO}>
              Shop
            </TransitionLink>
            <a
              href="https://lineacruda.com"
              target="_blank"
              rel="noopener"
              className="hover:text-[#5d5294]"
              style={MICRO}
            >
              Tattoos ↗
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
