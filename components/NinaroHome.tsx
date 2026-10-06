'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { TransitionLink, useTransitionCovered, REVEAL_CLEAR_DELAY } from '@/components/PageTransition'
import { NavBand, NavCrest, NAV_TRANSITION, navBarPad, navIconWidth, useScrolled } from '@/components/SideNav'

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

/* Icon columns (menu + play). Sized off the pre-shrink logo clamp so they keep their size. */
const ICON_COL_W = 'calc(clamp(174px, 24.5vw, 340px) * 0.133)'

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
      <section className="relative flex items-center justify-center h-screen min-h-[560px]">
        {/* Top bar — fixed; compacts onto a paper band once the page scrolls. The bar
            itself lets clicks through so its box never blocks the content below. */}
        <div
          // items-start: the menu icon column grows tall on desktop, so top-aligning
          // keeps TATTOO near the top rather than centred on the column.
          className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex items-start justify-between px-[34px]"
          style={{ paddingTop: navBarPad(scrolled), transition: `padding-top ${NAV_TRANSITION}` }}
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
            <span ref={iconsRef} className="block" aria-hidden="true">
              <Image
                src={ART.menuIcons}
                alt=""
                width={77}
                height={247}
                className="block h-auto"
                style={{
                  width: navIconWidth(scrolled),
                  transform: `scale(${(1 + iconNear * ICON_GROW).toFixed(3)})`,
                  transition: `width ${NAV_TRANSITION}, transform .5s ${EASE}`,
                }}
              />
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

        {/* Centre cluster — hovering it reveals the game entry */}
        <div
          onMouseEnter={() => loaded && setNear(true)}
          onMouseLeave={() => setNear(false)}
          className="relative z-20 flex items-center py-10"
          style={{
            gap: 'clamp(24px, 5vw, 76px)',
            opacity: centreHidden ? 0 : 1,
            pointerEvents: centreHidden ? 'none' : 'auto',
            transition: 'opacity .5s ease',
          }}
        >
          {/* Game entry — the game itself is a later phase, so this goes nowhere yet */}
          <a
            href="#game"
            onClick={(e) => e.preventDefault()}
            aria-label="Enter the game"
            aria-hidden={!near}
            tabIndex={near ? 0 : -1}
            className="flex flex-col items-center gap-2.5 w-16 no-underline"
            style={{
              opacity: near ? 1 : 0,
              transform: near ? 'translateY(0)' : 'translateY(10px)',
              pointerEvents: near ? 'auto' : 'none',
              transition: `opacity .55s ease, transform .7s ${EASE}`,
            }}
          >
            <Image
              src={ART.playIcons}
              alt=""
              width={78}
              height={247}
              className="block h-auto"
              style={{ width: ICON_COL_W }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 400,
                fontSize: '17px',
                letterSpacing: '.08em',
                color: MUTED,
                writingMode: 'vertical-rl',
              }}
            >
              Play
            </span>
          </a>

          {/* Logo block */}
          <div
            ref={logoRef}
            className="relative text-center"
          >
            {/* Wings — outside the tilt plane so they stay still, and positioned out of
                flow so logoRef's box (read by the collision measure) is unchanged. */}
            <div
              aria-hidden="true"
              style={{ opacity: menuOpen ? 0.2 : near ? 0.3 : 0.7, transition: 'opacity .5s ease' }}
            >
              <Image
                src={ART.wingLeft}
                alt=""
                width={1009}
                height={355}
                priority
                style={{
                  ...WING,
                  right: WING_GAP,
                  animation: `nr-unfurl-left 1.4s ${UNFURL_EASE} ${at(LOAD.wings)} both`,
                }}
              />
              <Image
                src={ART.wingRight}
                alt=""
                width={1007}
                height={353}
                priority
                style={{
                  ...WING,
                  left: WING_GAP,
                  animation: `nr-unfurl-right 1.4s ${UNFURL_EASE} ${at(LOAD.wings + LOAD.wingStagger)} both`,
                }}
              />
            </div>
            <div
              style={{
                // Position is pinned; only the plane turns. rotateY(+x) pushes the right
                // edge back and rotateX(-y) the top, so the wordmark faces the cursor.
                transform:
                  `perspective(900px) ` +
                  `rotateX(${(-glide.y * LOGO_TILT).toFixed(2)}deg) ` +
                  `rotateY(${(glide.x * LOGO_TILT).toFixed(2)}deg)`,
                transition: `transform .5s ${EASE}`,
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
                  transition: `transform .8s ${EASE}`,
                }}
              >
                <Image
                  src={ART.ornament}
                  alt=""
                  width={1192}
                  height={1328}
                  priority
                  className="block h-auto w-full"
                />
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
                style={{ animation: `nr-fadeup 1s ${EASE} ${at(LOAD.wordmark)} both` }}
              >
                <Image
                  src={ART.ninaro}
                  alt="NINARÒ"
                  width={1088}
                  height={350}
                  priority
                  className="block h-auto"
                  style={{ width: LOGO_W }}
                />
                {/* Sheen. Masked by the wordmark itself, so the light falls on the
                    letterforms rather than in a rectangle around them. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    // Geometry fixed, placement moved: `circle at x% y%` lives inside
                    // background-image and cannot transition, background-position can —
                    // so the light trails the cursor on the same .5s as the drift.
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,.45), rgba(255,255,255,0) 55%)',
                    backgroundSize: '170% 170%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `${(50 + glide.x * 50).toFixed(1)}% ${(50 + glide.y * 50).toFixed(1)}%`,
                    WebkitMaskImage: `url(${ART.ninaro})`,
                    maskImage: `url(${ART.ninaro})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    mixBlendMode: 'screen',
                    transition: `background-position .5s ${EASE}`,
                    willChange: 'background-position',
                  }}
                />
                {/* Load light pass — one band of light crosses the letters as they land */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(105deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.6) 50%, rgba(255,255,255,0) 62%)',
                    backgroundSize: '250% 100%',
                    backgroundRepeat: 'no-repeat',
                    WebkitMaskImage: `url(${ART.ninaro})`,
                    maskImage: `url(${ART.ninaro})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    mixBlendMode: 'screen',
                    // Resting state is off, so with animations disabled (reduced motion) it never shows.
                    opacity: 0,
                    animation: `nr-sheen-pass 1.1s ease-in-out ${at(LOAD.sheen)} both`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mirrors the game entry so the logo stays optically centred */}
          <span className="w-16" aria-hidden="true" />
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
              transition: `opacity .8s ease, transform 1.2s ${EASE}`,
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
                `color .4s ease, letter-spacing .4s ease`,
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
        className="relative mx-auto max-w-[1500px]"
        style={{ padding: 'clamp(60px, 9vw, 130px) clamp(22px, 5vw, 84px) 130px' }}
      >
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
            width={1088}
            height={350}
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
