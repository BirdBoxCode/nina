'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { TransitionLink } from '@/components/PageTransition'

/* --- Design tokens (Nocturne, run on a light paper ground) --- */
const PAPER = '#EFEBE2'
const FRAME = '#E6E1D7'
const INK = '#23222A'
const MUTED = '#595d6c'
const MUTED_LIGHT = '#75798c'
const DIMMED = '#a9a59b'
const RULE = '#b2b6ca'
const RULE_LIGHT = '#cfd3e5'
const BORDER = '#dcd8ce'
const ACCENT = '#5d5294'
const ACCENT_LINE = '#796cbf'

/* --- Assets. Paths confirmed against /public by checksum against the handoff set. --- */
const ART = {
  ninaro: '/images/assets/ninaro.png',
  ornament: '/images/assets/opera-senza.png',
  icon1: '/images/assets/icons/icon 1.png',
  icon2: '/images/assets/icons/icon 2.png',
  icon3: '/images/assets/icons/icon 3.png',
  bull: '/images/assets/components/bull.png',
  dragon: '/images/assets/components/dragon.png',
  shell: '/images/assets/components/shell.png',
  sword: '/images/assets/components/sword.png',
  marking: '/images/assets/components/marking.png',
  marking2: '/images/assets/components/marking-2.png',
}

const EASE = 'cubic-bezier(.2,.7,.2,1)'
const DRAW_EASE = 'cubic-bezier(.22,.7,.2,1)'
const MENU_STAGGER = 70

const GRAIN_URL =
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>` +
  `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>` +
  `<feColorMatrix type='saturate' values='0'/></filter>` +
  `<rect width='220' height='220' filter='url(%23n)' opacity='0.34'/></svg>")`

/* Ghost line PNGs are white line art on transparent; invert + multiply reads them dark on paper. */
const GHOST_FILTER: React.CSSProperties = {
  filter: 'invert(1)',
  mixBlendMode: 'multiply',
}

/* marking-2 ships as black line art, unlike the rest of the set; it only needs the multiply. */
const DARK_GHOSTS = new Set<string>([ART.marking2])

const CATS = [
  { label: 'MURALS', href: '/walls', left: '13%', top: '20%', rot: -3.5, ghost: ART.bull },
  { label: 'PAINTINGS', href: '/paintings', left: '23%', top: '34%', rot: 2.5, ghost: ART.marking },
  { label: 'ILLUSTRATIONS', href: '/illustration', left: '11%', top: '50%', rot: -1.5, ghost: ART.dragon },
  { label: 'INSTALLATIONS', href: '/installations', left: '24%', top: '66%', rot: 4, ghost: ART.shell },
  { label: 'STAGE DESIGN', href: '/stage-design', left: '68%', top: '21%', rot: 3.5, ghost: ART.marking2 },
  { label: 'WORKSHOPS', href: '/workshops', left: '73%', top: '36%', rot: -2.5, ghost: ART.sword },
  { label: 'ABOUT', href: '/bio-contact', left: '76%', top: '53%', rot: 1.5, ghost: ART.marking },
  { label: 'SHOP', href: '/shop', left: '75%', top: '68%', rot: -4, ghost: ART.shell },
  { label: 'TATTOOS ↗', href: 'https://lineacruda.com', left: '45%', top: '78%', rot: 1, ghost: ART.sword },
] as const

/** The four self-drawing hero lines. Dash length doubles as the starting dashoffset. */
const LINES = [
  { d: 'M450 40 C 300 170, 322 300, 408 372 C 500 448, 512 520, 430 600 C 352 676, 372 786, 452 862', w: 1.1, o: 0.5, dash: 2000, dur: '3.4s', delay: '.35s' },
  { d: 'M120 452 C 250 356, 356 386, 424 452 C 494 520, 610 546, 762 448', w: 1.1, o: 0.38, dash: 1600, dur: '3.4s', delay: '.9s' },
  { d: 'M228 168 C 340 268, 340 620, 236 736', w: 1, o: 0.22, dash: 1400, dur: '4s', delay: '1.4s' },
  { d: 'M672 168 C 560 268, 560 620, 664 736', w: 1, o: 0.22, dash: 1400, dur: '4s', delay: '1.4s' },
]

/** Background line drawings that breathe behind the hero. */
const BREATHERS: {
  src: string
  w: number
  h: number
  pos: React.CSSProperties
  width: string
  opacity: number
  anim: string
}[] = [
  { src: ART.marking, w: 376, h: 1200, pos: { left: '-3%', top: '4%' }, width: '15vw', opacity: 0.16, anim: 'nr-breathe 17s ease-in-out infinite' },
  { src: ART.sword, w: 494, h: 1200, pos: { right: '-2%', bottom: '-4%' }, width: '12vw', opacity: 0.14, anim: 'nr-breathe 21s ease-in-out infinite reverse' },
  { src: ART.shell, w: 1200, h: 769, pos: { left: '8%', bottom: '6%' }, width: '17vw', opacity: 0.13, anim: 'nr-breathe 25s ease-in-out infinite' },
]

/**
 * Selected work. Titles are placeholders from the design — swap for real project
 * names once the featured set comes from the project data source.
 * `span` carries only the >=900px design spans; below that cards stack 1-up then 2-up.
 */
const WORKS = [
  { title: 'UROBORO', cat: 'Murals', href: '/walls', span: 'min-[900px]:col-span-7', ratio: '4 / 3', mt: undefined, delay: 0 },
  { title: 'NOTTE CHIARA', cat: 'Paintings', href: '/paintings', span: 'min-[900px]:col-span-5', ratio: '3 / 4', mt: 'clamp(0px, 6vw, 92px)', delay: 80 },
  { title: 'DRAGO', cat: 'Illustration', href: '/illustration', span: 'min-[900px]:col-span-4', ratio: '1 / 1', mt: undefined, delay: 0 },
  { title: 'SOGLIA', cat: 'Installations', href: '/installations', span: 'min-[900px]:col-span-8', ratio: '16 / 9', mt: 'clamp(0px, 4vw, 58px)', delay: 80 },
  { title: 'SCENA VIVA', cat: 'Stage design', href: '/stage-design', span: 'min-[900px]:col-start-2 min-[900px]:col-span-5', ratio: '5 / 4', mt: 'clamp(0px, 3vw, 40px)', delay: 0 },
  { title: 'DO YOUR OWN', cat: 'Workshops', href: '/workshops', span: 'min-[900px]:col-span-4', ratio: '3 / 4', mt: 'clamp(0px, 9vw, 150px)', delay: 80 },
]

const MICRO: React.CSSProperties = {
  fontSize: '10.5px',
  letterSpacing: '.26em',
  textTransform: 'uppercase',
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
  const logoRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const { register, revealStyle } = useReveal()

  // Below ~900px the scattered menu stacks into a centred column (same stagger).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
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
    // Anything that is not a menu label dismisses. The top bar is excluded whole: this
    // fires on pointerdown, so closing there would only be undone by the button's click.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest('[data-nr-item]')) return
      if (barRef.current?.contains(target)) return
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
    setMenuOpen((o) => !o)
    setHover(null)
  }

  // On narrow screens the stacked menu would sit on top of the logo, so the centre
  // cluster steps aside while it is open. Desktop keeps the logo visible as designed.
  const centreHidden = narrow && menuOpen

  // The scattered labels sit on a fixed percentage grid, so at some viewport sizes one
  // lands on the logo. Measure and push only the labels that actually collide outward;
  // the designed scatter is untouched wherever it already fits. Narrow screens stack the
  // menu and hide the centre cluster, so there is nothing to clear there.
  useEffect(() => {
    const GUTTER = 20
    const EDGE = 12

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

      // Clear the logo vertically as well: pin the art's bottom edge above the logo's top,
      // and fit it into the band between the top bar and the logo.
      const barBottom = barRef.current?.getBoundingClientRect().bottom ?? origin.top
      const bandTop = barBottom + GUTTER
      const bandBottom = box.top - GUTTER
      const bottom = Math.round(origin.bottom - box.top + GUTTER)
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
      className="nr-home relative min-h-screen overflow-x-hidden font-[family-name:var(--font-inter)] font-normal"
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
        {/* Breathing ghost line drawings */}
        {BREATHERS.map((b, i) => (
          <Image
            key={i}
            src={b.src}
            alt=""
            width={b.w}
            height={b.h}
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              ...b.pos,
              width: b.width,
              height: 'auto',
              opacity: b.opacity,
              animation: b.anim,
              ...GHOST_FILTER,
            }}
          />
        ))}

        {/* Self-drawing line ornament */}
        <svg
          viewBox="0 0 900 900"
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none"
          style={{
            width: 'min(78vh, 86vw)',
            height: 'min(78vh, 86vw)',
            // Recede while the menu is open so the hover art reads clearly over the lines.
            opacity: menuOpen ? 0.45 : 1,
            transition: 'opacity .7s ease',
          }}
        >
          {LINES.map((l, i) => (
            <path
              key={i}
              d={l.d}
              fill="none"
              stroke={ACCENT_LINE}
              strokeWidth={l.w}
              strokeLinecap="round"
              opacity={l.o}
              className="nr-line"
              style={{
                strokeDasharray: l.dash,
                strokeDashoffset: l.dash,
                animation: `nr-draw ${l.dur} ${DRAW_EASE} ${l.delay} forwards`,
              }}
            />
          ))}
        </svg>

        {/* Top bar */}
        <div
          ref={barRef}
          className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between px-[34px] py-[30px]"
        >
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-3 bg-transparent border-0 p-1.5 cursor-pointer"
            style={{ animation: 'nr-fadeup 1s ease .2s both' }}
          >
            <span className="flex flex-col gap-[5px]" aria-hidden="true">
              <Image src={ART.icon1} alt="" width={18} height={18} className="w-[18px] h-[18px]" />
              <Image src={ART.icon2} alt="" width={18} height={18} className="w-[18px] h-[18px] ml-1" />
              <Image src={ART.icon3} alt="" width={18} height={18} className="w-[18px] h-[18px]" />
            </span>
            <span style={{ ...MICRO, fontSize: '12px', color: MUTED }}>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          </button>

          <a
            href="https://lineacruda.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 p-1.5"
            style={{ animation: 'nr-fadeup 1s ease .35s both' }}
          >
            <span style={{ ...MICRO, fontSize: '12px', color: MUTED }}>TATTOO</span>
            <Image src={ART.icon2} alt="" width={26} height={26} className="w-[26px] h-[26px]" aria-hidden="true" />
          </a>
        </div>

        {/* Centre cluster — hovering it reveals the game entry */}
        <div
          onMouseEnter={() => setNear(true)}
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
              src={ART.ornament}
              alt=""
              width={64}
              height={74}
              className="w-16 h-[74px] object-contain"
            />
            <span
              style={{
                fontSize: '12px',
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: MUTED,
                writingMode: 'vertical-rl',
              }}
            >
              PLAY
            </span>
          </a>

          {/* Logo block */}
          <div
            ref={logoRef}
            className="text-center"
            style={{ animation: `nr-fadeup 1.5s ${EASE} .1s both` }}
          >
            <Image
              src={ART.ninaro}
              alt="NINARÒ"
              width={1088}
              height={350}
              priority
              className="block h-auto"
              style={{ width: 'clamp(240px, 34vw, 470px)' }}
            />
            <div className="mt-5 flex items-center justify-center gap-[14px]">
              <span
                className="h-px w-[46px]"
                style={{ background: `linear-gradient(to right, transparent, ${RULE})` }}
              />
              <span style={{ fontSize: '10.5px', letterSpacing: '.34em', textTransform: 'uppercase', color: MUTED }}>
                ARTIST : TATTOOIST
              </span>
              <span
                className="h-px w-[46px]"
                style={{ background: `linear-gradient(to left, transparent, ${RULE})` }}
              />
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
              width: 'min(34vh, 38vw)',
              height: 'min(34vh, 38vw)',
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
              top: narrow ? `${16 + i * 8.5}%` : c.top,
              fontSize: 'clamp(15px, 1.5vw, 23px)',
              letterSpacing: hover === i ? '.18em' : '.14em',
              textTransform: 'uppercase',
              fontWeight: 300,
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
              onMouseEnter: () => {
                setHover(i)
                setGhostSrc(c.ghost)
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
            animation: 'nr-fadeup 1.2s ease 1.1s both',
            opacity: centreHidden ? 0 : undefined,
            transition: 'opacity .5s ease',
          }}
        >
          <span style={{ fontSize: '9.5px', letterSpacing: '.3em', textTransform: 'uppercase', color: MUTED_LIGHT }}>
            SCROLL
          </span>
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
            style={{ fontSize: 'clamp(20px, 2.2vw, 30px)', fontWeight: 400, letterSpacing: '.04em', color: INK }}
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
                    style={{ fontSize: '13.5px', letterSpacing: '.13em', textTransform: 'uppercase' }}
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
              ABOUT
            </TransitionLink>
            <TransitionLink href="/shop" className="hover:text-[#5d5294]" style={MICRO}>
              SHOP
            </TransitionLink>
            <a
              href="https://lineacruda.com"
              target="_blank"
              rel="noopener"
              className="hover:text-[#5d5294]"
              style={MICRO}
            >
              TATTOOS ↗
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
