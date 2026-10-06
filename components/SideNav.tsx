'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { TransitionLink } from '@/components/PageTransition'

/* --- Tokens shared with the home page (NinaroHome) --- */
export const PAPER = '#EFEBE2'
const INK = '#5C5970'
const ACCENT = '#5d5294'
const PANEL = '#DBDCC1'
const EASE = 'cubic-bezier(.2,.7,.2,1)'

const ICONS = '/images/assets/icons/purple-icons.png'
const NINARO = '/images/assets/ninaro.png'
const CREST = '/images/assets/opera-senza.png'

/* Icon column at rest, matched to the home page; compact once the page scrolls. */
const ICON_W = 'calc(clamp(174px, 24.5vw, 340px) * 0.133)'
const ICON_W_COMPACT = 'calc(clamp(174px, 24.5vw, 340px) * 0.133 * 0.5)'
/* Column height at rest (art is 77×247), plus the bar's 30px top pad and the button's 6px pads. */
const BAR_H = 'calc(clamp(174px, 24.5vw, 340px) * 0.133 * 247 / 77 + 42px)'
/* Compact bar: 14px top pad, 6px button pads, half-height column, 14px below. */
const BAND_H = 'calc(clamp(174px, 24.5vw, 340px) * 0.133 * 0.5 * 247 / 77 + 40px)'
/* Resting icon column height, and the subpage crest: ~93% of that height (about 121×135 on desktop). */
const ICON_H = 'calc(clamp(174px, 24.5vw, 340px) * 0.133 * 247 / 77)'
const CREST_W = 'calc(clamp(174px, 24.5vw, 340px) * 0.356)'

const ICON_GROW = 0.12
const ICON_REACH = 180

const LINKS = [
  { label: 'Murals', href: '/walls' },
  { label: 'Paintings', href: '/paintings' },
  { label: 'Illustrations', href: '/illustration' },
  { label: 'Installations', href: '/installations' },
  { label: 'Stage Design', href: '/stage-design' },
  { label: 'Workshops', href: '/workshops' },
  { label: 'About', href: '/bio-contact' },
  { label: 'Shop', href: '/shop' },
] as const

/**
 * True once the page has scrolled past `px`. Pass a function for a threshold that
 * depends on the viewport; it is read on every check, so it may change between renders.
 */
export function useScrolled(px: number | (() => number) = 40) {
  const [scrolled, setScrolled] = useState(false)
  const threshold = useRef(px)
  useEffect(() => {
    threshold.current = px
  })
  useEffect(() => {
    const sync = () => {
      const t = threshold.current
      setScrolled(window.scrollY > (typeof t === 'function' ? t() : t))
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])
  return scrolled
}

/** Bar top padding and icon width for the rest / compact states, with the shared easing. */
export const navBarPad = (compact: boolean) => (compact ? 14 : 30)
export const navIconWidth = (compact: boolean) => (compact ? ICON_W_COMPACT : ICON_W)
export const NAV_TRANSITION = `.5s ${EASE}`

/**
 * Paper band behind the fixed bar. Slightly see-through with a soft blur, and masked
 * to fade out at its lower edge so scrolled content slips under it without a hard line.
 * Sits inside the fixed bar; the bar's own children must be `relative` to paint above it.
 */
export function NavBand({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{
        height: BAND_H,
        background: 'rgba(239, 235, 226, .86)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        maskImage: 'linear-gradient(to bottom, #000 72%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent)',
        opacity: show ? 1 : 0,
        transition: `opacity ${NAV_TRANSITION}`,
      }}
    />
  )
}

/* Crest top offset: bar pad + button pad, plus half the difference between the icon
   column and the crest heights, so the two stay centred on each other in both states. */
const CREST_H = `${CREST_W} * 1328 / 1192`
const CREST_TOP = `calc(36px + (${ICON_H} - ${CREST_H}) / 2)`
const CREST_TOP_COMPACT = `calc(20px + (${ICON_H} - ${CREST_H}) / 4)`

/**
 * Opera Senza crest, centred in the fixed bar and linking home. Shrinks to half with the
 * icons when `compact`. Must sit inside the fixed bar, which is its positioning box.
 */
export function NavCrest({ compact, show }: { compact: boolean; show: boolean }) {
  return (
    // Outer box carries placement and visibility; the link inside carries the entrance.
    // Kept apart because nr-fadeup fills `both`, and would pin opacity and transform.
    <div
      className="absolute left-1/2"
      style={{
        top: compact ? CREST_TOP_COMPACT : CREST_TOP,
        transform: 'translateX(-50%)',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition: `top ${NAV_TRANSITION}, opacity .5s ease`,
      }}
    >
      <TransitionLink
        href="/"
        aria-label="NINARÒ — home"
        tabIndex={show ? 0 : -1}
        className="block"
        style={{ animation: `nr-fadeup 1.5s ${EASE} .1s both` }}
      >
        <Image
          src={CREST}
          alt=""
          width={1192}
          height={1328}
          priority
          className="block h-auto"
          style={{
            width: compact ? `calc(${CREST_W} * 0.5)` : CREST_W,
            transition: `width ${NAV_TRANSITION}`,
          }}
        />
      </TransitionLink>
    </div>
  )
}

/** Subpage navigation: fixed icon bar (as on the home page) opening a left-hand panel. */
export function SideNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const scrolled = useScrolled()
  // 0..1 — how close the cursor is to the icons; 1 is touching.
  const [near, setNear] = useState(0)
  const iconsRef = useRef<HTMLSpanElement | null>(null)

  // Icon proximity, gated like the home page: no hover devices, no reduced motion.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = iconsRef.current?.getBoundingClientRect()
        if (!box) return
        const dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right)
        const dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom)
        const t = Math.max(0, 1 - Math.hypot(dx, dy) / ICON_REACH)
        setNear((prev) => (Math.abs(prev - t) < 0.01 ? prev : t))
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  // Escape closes; the page behind holds still while the panel is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const linkStyle = (active: boolean, i: number): React.CSSProperties => ({
    fontFamily: 'var(--font-display)',
    fontSize: '26px',
    lineHeight: 1.15,
    color: active ? ACCENT : INK,
    opacity: open ? 1 : 0,
    transform: open ? 'none' : 'translateX(-14px)',
    transition:
      `opacity .6s ${EASE} ${open ? 150 + i * 50 : 0}ms, ` +
      `transform .7s ${EASE} ${open ? 150 + i * 50 : 0}ms, ` +
      `color .4s ease, letter-spacing .4s ease`,
  })

  return (
    <>
      {/* In-flow spacer: the bar is fixed, so this holds its resting height. Paper so it
          matches the page beneath, whichever wrapper the page renders below it. */}
      <div aria-hidden="true" style={{ height: BAR_H, background: PAPER }} />

      {/* Fixed bar — above the panel so the icons double as the close control */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] px-[34px]"
        style={{ paddingTop: navBarPad(scrolled), transition: `padding-top ${NAV_TRANSITION}` }}
      >
        <NavBand show={scrolled && !open} />
        {/* Hidden while the panel is open: on phones the panel runs under it. */}
        <NavCrest compact={scrolled} show={!open} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Menu'}
          aria-expanded={open}
          aria-controls="side-nav"
          className="pointer-events-auto relative block cursor-pointer border-0 bg-transparent p-1.5"
          style={{ animation: 'nr-fadeup 1s ease .2s both' }}
        >
          <span ref={iconsRef} className="block" aria-hidden="true">
            <Image
              src={ICONS}
              alt=""
              width={77}
              height={247}
              className="block h-auto"
              style={{
                width: navIconWidth(scrolled),
                transform: `scale(${(1 + near * ICON_GROW).toFixed(3)})`,
                transition: `width ${NAV_TRANSITION}, transform ${NAV_TRANSITION}`,
              }}
            />
          </span>
        </button>
      </div>

      {/* Dim layer — clicking anywhere outside the panel closes it */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[64] motion-reduce:transition-none"
        style={{
          background: 'rgba(46, 40, 60, .18)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .5s ease',
        }}
      />

      {/* Panel */}
      <nav
        id="side-nav"
        aria-label="Site"
        aria-hidden={!open}
        className="fixed left-0 top-0 z-[65] flex h-dvh flex-col overflow-y-auto px-[40px] pb-10 motion-reduce:transition-none"
        style={{
          width: 'min(360px, 85vw)',
          background: PANEL,
          // 48px of air between the icons and the NINARÒ wordmark.
          paddingTop: `calc(${BAR_H} + 48px)`,
          transform: open ? 'none' : 'translateX(-100%)',
          boxShadow: open ? '0 0 40px rgba(46, 40, 60, .12)' : 'none',
          transition: `transform .5s ${EASE}, box-shadow .5s ease`,
        }}
      >
        <TransitionLink
          href="/"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="mb-8 block"
          style={linkStyle(false, 0)}
        >
          <Image src={NINARO} alt="NINARÒ" width={1088} height={350} className="block h-auto w-[132px]" />
        </TransitionLink>

        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {LINKS.map((l, i) => {
            const active = pathname === l.href
            return (
              <li key={l.href}>
                <TransitionLink
                  href={l.href}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className="inline-block hover:text-[#5d5294]! hover:tracking-[.04em]"
                  style={linkStyle(active, i + 1)}
                >
                  {l.label}
                </TransitionLink>
              </li>
            )
          })}
        </ul>

        <span
          aria-hidden="true"
          className="my-7 block h-px w-14"
          style={{ background: INK, opacity: open ? 0.25 : 0, transition: 'opacity .6s ease' }}
        />

        <a
          href="https://lineacruda.com"
          target="_blank"
          rel="noopener"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="inline-block self-start hover:text-[#5d5294]! hover:tracking-[.04em]"
          style={linkStyle(false, LINKS.length + 1)}
        >
          Tattoo ↗
        </a>
      </nav>
    </>
  )
}
