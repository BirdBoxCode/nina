'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion'
import {
  TransitionLink,
  useTransitionCovered,
  REVEAL_CLEAR_DELAY,
} from '@/components/PageTransition'
import { SideNav, PAPER } from '@/components/SideNav'
import { CATEGORY_META, type ArtCategory, type Artwork } from '@/lib/artworks'

// Paper ground, matching the home page.
const SURFACE = PAPER
const INK = '#2E3352'

// Peak diagonal, in degrees. Shared by the load-in and the scroll response so
// both lean the same way — scrolling down maps to a negative skew, so entry does too.
const SKEW_MAX = 4

/* Carousel: two linked rows that step together. Each row holds PER_ROW items. */
const PER_ROW = 8
/* One step: the top row glides first, the bottom row follows a beat later. */
const STEP_S = 0.8
const BOTTOM_LAG_S = 0.08
const STEP_EASE = 'cubic-bezier(.45,.05,.2,1)'
/* A drag past this many px (or a quick flick) steps; anything less springs back. */
const DRAG_STEP = 50

/* Placeholder frames until the real pieces land — soft tints from the site palette. */
const PLACEHOLDER_TINTS = ['#E6E1D7', '#DBDCC1', '#D9D6E6', '#E4DCCF', '#CFD3E5']

type Slot = { kind: 'piece'; piece: Artwork } | { kind: 'placeholder'; tint: string }

/** Real pieces first, then placeholders up to PER_ROW. */
function fillRow(pieces: Artwork[], seed: number): Slot[] {
  const slots: Slot[] = pieces.map((piece) => ({ kind: 'piece', piece }))
  for (let i = slots.length; i < PER_ROW; i++) {
    slots.push({ kind: 'placeholder', tint: PLACEHOLDER_TINTS[(i + seed) % PLACEHOLDER_TINTS.length] })
  }
  return slots.slice(0, PER_ROW)
}

const mod = (n: number, m: number) => ((n % m) + m) % m

function CarouselTile({
  slot,
  large,
  onActivate,
}: {
  slot: Slot
  large: boolean
  /** Return true to take over the click (a peeking card centres instead of opening). */
  onActivate: (e: React.MouseEvent) => boolean
}) {
  const frame = (
    <div
      className={
        large
          ? 'relative aspect-[4/5] w-full overflow-hidden md:aspect-[16/9]'
          : 'relative aspect-[4/3] w-full overflow-hidden'
      }
      style={{ backgroundColor: slot.kind === 'piece' ? slot.piece.tint : slot.tint }}
    >
      {slot.kind === 'piece' && (
        <>
          <Image
            src={slot.piece.image}
            alt={slot.piece.title}
            fill
            draggable={false}
            sizes={large ? '(max-width: 768px) 86vw, 1000px' : '(max-width: 768px) 43vw, 330px'}
            className={
              slot.piece.fit === 'cover'
                ? 'object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
                : 'object-contain p-10 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
            }
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
        </>
      )}
    </div>
  )

  const caption = (
    <div className="mt-4 flex items-baseline justify-between">
      <h3 className="text-[11px] uppercase tracking-[0.28em]" style={{ color: INK }}>
        {slot.kind === 'piece' ? slot.piece.title : 'Untitled'}
      </h3>
      <span className="text-[10px] uppercase tracking-[0.22em] opacity-45" style={{ color: INK }}>
        {slot.kind === 'piece' ? slot.piece.year : '—'}
      </span>
    </div>
  )

  if (slot.kind === 'placeholder') {
    return (
      <div onClick={(e) => onActivate(e)}>
        {frame}
        {caption}
      </div>
    )
  }

  return (
    <TransitionLink
      href={`/works/${slot.piece.slug}`}
      className="group block"
      draggable={false}
      onClick={(e) => {
        if (onActivate(e)) e.preventDefault()
      }}
    >
      {frame}
      {caption}
    </TransitionLink>
  )
}

/**
 * One carousel row. Items are rendered three times over so the row can glide past
 * either end; ArtGallery snaps the index back into the middle copy once a glide settles.
 */
function CarouselRow({
  slots,
  large,
  index,
  instant,
  drag,
  lag,
  reduced,
  entryDelay,
  skew,
  onPick,
}: {
  slots: Slot[]
  large: boolean
  index: number
  instant: boolean
  drag: number
  lag: number
  reduced: boolean
  entryDelay: number
  skew: MotionValue<number>
  /** Called with the step offset of a clicked card; returns true if it took the click. */
  onPick: (offset: number, e: React.MouseEvent) => boolean
}) {
  const n = slots.length
  const at = n + index // rendered position of the current item, in the middle copy
  const tripled = [...slots, ...slots, ...slots]

  const duration = instant || drag !== 0 ? 0 : reduced ? 0.25 : STEP_S

  return (
    // Load-in: the row flies up carrying the scroll lean, then settles — as the grid did.
    <motion.div
      initial={{ opacity: 0, y: 110, skewY: -SKEW_MAX }}
      whileInView={{ opacity: 1, y: 0, skewY: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: entryDelay }}
    >
      {/* Scroll-velocity skew — independent of the entry animation above */}
      <motion.div style={{ skewY: skew }}>
        <div
          className="flex"
          style={{
            gap: 'var(--g)',
            // Start the track so card `at` sits where the centred top card does.
            paddingLeft: 'calc(50% - var(--tw) / 2)',
            transform:
              `translate3d(calc(${-at} * (var(--cw) + var(--g)) + ${drag.toFixed(1)}px), 0, 0)`,
            transition: duration ? `transform ${duration}s ${STEP_EASE} ${reduced ? 0 : lag}s` : 'none',
            willChange: 'transform',
          }}
        >
          {tripled.map((slot, r) => (
            <div
              key={r}
              className="shrink-0"
              style={{ width: 'var(--cw)' }}
              // Cards well off screen stay out of the tab order and the accessibility tree.
              // Top keeps its peeking neighbours live (a click centres them).
              inert={large ? Math.abs(r - at) > 1 : r - at < -1 || r - at > 3}
            >
              <CarouselTile slot={slot} large={large} onActivate={(e) => onPick(r - at, e)} />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ArtGallery({
  category,
  pieces,
}: {
  category: ArtCategory
  pieces: Artwork[]
}) {
  const meta = CATEGORY_META[category]

  // One scroll listener for the whole page; both rows share the value.
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(velocity, { stiffness: 320, damping: 55 })
  const skew = useTransform(
    smoothVelocity,
    [-2400, 0, 2400],
    [SKEW_MAX, 0, -SKEW_MAX],
    { clamp: true }
  )

  // Arriving via the wipe means this page mounts hidden — hold the reveal until
  // the panel has cleared. Captured once at mount so it never re-triggers.
  const covered = useTransitionCovered()
  const [baseDelay] = useState(() => (covered ? REVEAL_CLEAR_DELAY : 0.1))

  // Real pieces split across the two rows, each topped up with placeholders.
  const half = Math.ceil(pieces.length / 2)
  const [top] = useState(() => fillRow(pieces.slice(0, half), 0))
  const [bottom] = useState(() => fillRow(pieces.slice(half), 2))

  // `index` may run one lap past either end mid-glide; `instant` snaps it back unseen.
  const [index, setIndex] = useState(0)
  const [instant, setInstant] = useState(false)
  const [drag, setDrag] = useState(0)
  const [reduced, setReduced] = useState(false)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carouselRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const go = useCallback(
    (delta: number) => {
      if (!delta) return
      setIndex((i) => {
        // Never run more than one lap out of the middle copy, however fast the clicks.
        const next = i + delta
        return next < -PER_ROW + 1 || next > 2 * PER_ROW - 2 ? i : next
      })
    },
    []
  )

  // Once a glide (and the bottom row's lag) has finished, fold the index back into
  // range with transitions off, so the loop never shows its seam.
  useEffect(() => {
    if (index >= 0 && index < PER_ROW) return
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      setInstant(true)
      setIndex((i) => mod(i, PER_ROW))
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)))
    }, (reduced ? 0.25 : STEP_S + BOTTOM_LAG_S) * 1000 + 30)
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
  }, [index, reduced])

  // Horizontal trackpad scroll: one step per gesture. Native listener so it can claim
  // the event (and stop the browser's swipe-back) — React's wheel listener is passive.
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    let locked = false
    let unlock: ReturnType<typeof setTimeout> | null = null
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      // Momentum keeps firing after the fingers lift; hold the lock until it dies down.
      if (unlock) clearTimeout(unlock)
      unlock = setTimeout(() => (locked = false), 260)
      if (locked || Math.abs(e.deltaX) < 12) return
      locked = true
      go(e.deltaX > 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (unlock) clearTimeout(unlock)
    }
  }, [go])

  // Drag / swipe on either row. Pointer events cover mouse, pen and touch; the
  // container's `touch-action: pan-y` leaves vertical page scrolling to the browser.
  const dragState = useRef<{ x: number; t: number; id: number } | null>(null)
  const dragged = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragState.current = { x: e.clientX, t: performance.now(), id: e.pointerId }
    dragged.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragState.current
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    if (!dragged.current && Math.abs(dx) > 6) {
      dragged.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (dragged.current) setDrag(dx)
  }
  const onPointerEnd = (e: React.PointerEvent) => {
    const s = dragState.current
    if (!s || s.id !== e.pointerId) return
    dragState.current = null
    if (!dragged.current) return
    const dx = e.clientX - s.x
    const speed = Math.abs(dx) / Math.max(1, performance.now() - s.t)
    setDrag(0)
    if (Math.abs(dx) > DRAG_STEP || speed > 0.5) go(dx < 0 ? 1 : -1)
    // The click that follows this pointerup is swallowed by the pick handlers; clear
    // the flag after it so later keyboard clicks go through.
    setTimeout(() => (dragged.current = false), 0)
  }

  // Top-row clicks on a peeking card centre it; a drag never counts as a click.
  const pickTop = (offset: number, e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault()
      return true
    }
    if (offset !== 0) {
      e.preventDefault()
      go(offset)
      return true
    }
    return false
  }
  const pickBottom = (_offset: number, e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault()
      return true
    }
    return false
  }

  const current = mod(index, PER_ROW)

  return (
    // `relative z-10 isolate` lifts the page above the fixed z-0 fluid canvas.
    <div
      className="relative z-10 isolate min-h-screen w-full"
      style={{ backgroundColor: SURFACE }}
    >
      <SideNav />

      <main className="mx-auto max-w-[1280px] px-6 pt-10 md:px-10 md:pt-16">
        <div className="mb-12 flex items-baseline gap-4 md:mb-20">
          <h1
            className="font-display text-[44px] leading-none md:text-[64px]"
            style={{ color: INK }}
          >
            {meta.label}
          </h1>
          <span
            className="text-[10px] uppercase tracking-[0.35em] opacity-40 md:text-[11px]"
            style={{ color: INK }}
          >
            {meta.subtitle}
          </span>
        </div>
      </main>

      {/* Carousel — full bleed, two linked rows stepping together */}
      <section
        ref={carouselRef}
        aria-roledescription="carousel"
        aria-label={meta.label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          else if (e.key === 'ArrowLeft') go(-1)
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // Card sizes for both rows: --tw is the centred top card, --g the gap. Each row
        // sets --cw, its own card width, from these.
        className="group/carousel relative w-full select-none overflow-x-clip pb-32 outline-none [touch-action:pan-y] [--g:clamp(14px,1.7vw,24px)] [--tw:min(64vw,1000px)] max-md:[--tw:86vw]"
      >
        <div className="relative [--cw:var(--tw)]">
          <CarouselRow
            slots={top}
            large
            index={index}
            instant={instant}
            drag={drag}
            lag={0}
            reduced={reduced}
            entryDelay={baseDelay}
            skew={skew}
            onPick={pickTop}
          />

          {/* Prev / next — desktop, shown while the carousel is hovered or focused */}
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir < 0 ? 'Previous' : 'Next'}
              onClick={() => go(dir)}
              className={
                'absolute top-[calc(min(64vw,1000px)*9/32)] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full ' +
                'opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 focus-visible:opacity-100 md:flex ' +
                (dir < 0 ? 'left-[calc(50%_-_min(32vw,500px)_-_22px)]' : 'right-[calc(50%_-_min(32vw,500px)_-_22px)]')
              }
              style={{ background: 'rgba(239, 235, 226, .9)', color: INK, boxShadow: '0 2px 14px rgba(46,51,82,.12)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d={dir < 0 ? 'M9 2 4 7l5 5' : 'M5 2l5 5-5 5'}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Bottom row: card width is a third of the top card (half on phones) */}
        <div className="mt-6 [--cw:calc((var(--tw)_-_2*var(--g))/3)] max-md:[--cw:calc((var(--tw)_-_var(--g))/2)] md:mt-8">
          <CarouselRow
            slots={bottom}
            large={false}
            index={index}
            instant={instant}
            drag={drag * 0.4}
            lag={BOTTOM_LAG_S}
            reduced={reduced}
            entryDelay={baseDelay + 0.15}
            skew={skew}
            onPick={pickBottom}
          />
        </div>

        {/* Dots — the current one stretches into a pill */}
        <div className="mt-10 flex items-center justify-center gap-2.5">
          {top.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to item ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => {
                // Travel the short way round the loop.
                let d = i - current
                if (d > PER_ROW / 2) d -= PER_ROW
                if (d < -PER_ROW / 2) d += PER_ROW
                go(d)
              }}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: i === current ? 26 : 8,
                background: INK,
                opacity: i === current ? 0.85 : 0.25,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
