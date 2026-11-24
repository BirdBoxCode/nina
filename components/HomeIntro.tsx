'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/*
 * Home intro. Covers the hero on a full page load (first visit or refresh, never on an
 * in-app navigation) while the 3D pieces build, then opens onto it.
 *
 * Dark ink ground with paper-coloured type: a faint imprint of the Opera Senza crest and
 * NINA ROSSI drawn in outline then filled, each placed exactly where the hero's own crest
 * and name sit. When ready it inverts (paper ground, ink type) and opens onto the hero, so
 * the hand-off lands in place. Below, a "Getting ready" counter and a rolling status line.
 *
 * Every moving part animates opacity or transform only, so the browser can keep it smooth
 * while the main thread is busy building the 3D. The counter is the exception (it is text).
 */

/* Shared with NinaroHome's tokens; kept here to avoid a circular import. */
const PAPER = '#EFEBE2'
const INK = '#76736B'
/* While loading the intro is dark: an ink ground with paper-coloured type. */
const PAPER_SOFT = 'rgba(239,235,226,.62)'
const PAPER_FAINT = 'rgba(239,235,226,.22)'
/* Intro ground: the ink's hue, deepened so the paper-coloured type reads clearly. */
const INTRO_GROUND = '#58554E'
const EASE = 'cubic-bezier(.22,1,.36,1)'
const OPEN_EASE = 'cubic-bezier(.76,0,.24,1)'

/* Shown at least this long so it never flashes, and never longer than the cap. */
/* The minimum covers the full sequence: name drawn and filled, then the first role in. */
const MIN_MS = 3000
const MAX_MS = 4500
/* Inversion: dark ground to paper, beige type to ink. The hero's entrance starts at
   INVERT_HANDOFF, overlapping the end of it. */
const INVERT_MS = 900
const INVERT_HANDOFF = 600
/* Exit: the paper opens from the crest; the layer is removed once it has faded. */
const EXIT_MS = 2000

/* One status line: rolls in once and stays until the loader fades at the inversion. */
const PHRASES = ['Preparing the paper']
/* The first role rolls in once NINA ROSSI has filled. */
const ROLE_AT = 2.0

/* Module scope survives in-app navigation and resets on a full load or refresh. */
let introShown = false

/** True when this mount should play the intro (a full page load, not an in-app visit). */
export function useIntroOnce() {
  const [play] = useState(() => !introShown)
  useEffect(() => {
    introShown = true
  }, [])
  return play
}

export type IntroLayout = {
  crest: { cx: number; cy: number; w: number; h: number }
  name: { left: number; top: number; width: number; fontSize: number; align: 'left' | 'center' }
  roles: { left: number; top: number; width: number; fontSize: number; fontWeight: number; justify: string }
}

export function HomeIntro({
  progress,
  measure,
  words,
  role,
  rolesEl,
  crestSrc,
  onOpen,
}: {
  /** 0..1 — share of the things the hero waits on that are ready. */
  progress: number
  /** Where the hero's crest and name rest, in viewport px; null until laid out. */
  measure: () => IntroLayout | null
  words: readonly { text: string; weight: number }[]
  /** The hero's first role; rolls in after the name and is left in place for the hero. */
  role: string
  /** The hero's roles; followed every frame, since the hero's cursor depth drifts them. */
  rolesEl: React.RefObject<HTMLElement | null>
  crestSrc: string
  /** Called as the paper starts to open: the hero's entrance starts here. */
  onOpen: () => void
}) {
  const [layout, setLayout] = useState<IntroLayout | null>(null)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'inverting' | 'opening' | 'gone'>('loading')
  const progressRef = useRef(progress)
  const onOpenRef = useRef(onOpen)
  const measureRef = useRef(measure)
  const rolesCopyRef = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    progressRef.current = progress
    onOpenRef.current = onOpen
    measureRef.current = measure
  })

  // Place the imprint, name and role over their hero counterparts, checked every frame:
  // the hero shifts when the scroll lock removes the scrollbar, when fonts land and on
  // resize. State only updates when something moved by more than half a pixel.
  useEffect(() => {
    let frame = 0
    let last: IntroLayout | null = null
    const moved = (a: IntroLayout, b: IntroLayout | null) => {
      if (!b) return true
      const near = (x: number, y: number) => Math.abs(x - y) <= 0.5
      return !(
        near(a.crest.cx, b.crest.cx) && near(a.crest.cy, b.crest.cy) &&
        near(a.crest.w, b.crest.w) && near(a.crest.h, b.crest.h) &&
        near(a.name.left, b.name.left) && near(a.name.top, b.name.top) &&
        near(a.name.width, b.name.width) && near(a.name.fontSize, b.name.fontSize) &&
        a.name.align === b.name.align &&
        near(a.roles.width, b.roles.width) && near(a.roles.fontSize, b.roles.fontSize) &&
        a.roles.fontWeight === b.roles.fontWeight && a.roles.justify === b.roles.justify
      )
    }
    const check = () => {
      const next = measureRef.current()
      if (next && moved(next, last)) {
        last = next
        setLayout(next)
      }
      frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Keep the role copy exactly over the hero's, which drifts a few px with the cursor.
  useEffect(() => {
    let frame = 0
    const follow = () => {
      const src = rolesEl.current?.getBoundingClientRect()
      const copy = rolesCopyRef.current
      if (src && copy) {
        copy.style.left = `${src.left}px`
        copy.style.top = `${src.top}px`
      }
      frame = requestAnimationFrame(follow)
    }
    frame = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(frame)
  }, [rolesEl])

  // No scrolling under the intro.
  useEffect(() => {
    if (phase === 'opening' || phase === 'gone') return
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prev
    }
  }, [phase])

  // Counter: eases toward the real progress, with a slow time ramp under it so it never
  // sits still; opens once everything is ready (or at the cap) and the count reaches 100.
  useEffect(() => {
    const t0 = performance.now()
    let shown = 0
    let frame = 0
    const tick = () => {
      const t = performance.now() - t0
      const late = t >= MAX_MS
      const ramp = Math.min(0.85, t / MAX_MS)
      const target = late ? 1 : Math.max(progressRef.current, ramp)
      shown += (target * 100 - shown) * (late ? 0.25 : 0.08)
      if (target >= 1 && 100 - shown < 0.6) shown = 100
      setCount(Math.floor(shown))
      if (shown >= 100 && t >= MIN_MS) {
        setPhase('inverting')
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (phase === 'inverting') {
      const id = setTimeout(() => {
        setPhase('opening')
        onOpenRef.current()
      }, INVERT_HANDOFF)
      return () => clearTimeout(id)
    }
    if (phase === 'opening') {
      const id = setTimeout(() => setPhase('gone'), EXIT_MS)
      return () => clearTimeout(id)
    }
  }, [phase])

  if (phase === 'gone') return null

  const opening = phase === 'opening'
  // From the inversion on: the same animation strings stay set through the opening, so
  // nothing restarts when the phase moves on.
  const inverted = phase !== 'loading'
  const invert = `${INVERT_MS / 1000}s ease both`
  const phrase = 0
  // The opening is a soft hole in a paper sheet, centred on the crest and grown by scale
  // (a transform), sized just past the farthest viewport corner.
  const c = layout?.crest
  const reach = c && typeof window !== 'undefined'
    ? Math.hypot(Math.max(c.cx, window.innerWidth - c.cx), Math.max(c.cy, window.innerHeight - c.cy))
    : 0
  const sheet = Math.ceil(reach * 2.2)

  // Index of each word's first letter across the whole name.
  const offsets = words.map((_, wi) => words.slice(0, wi).reduce((n, w) => n + w.text.length, 0))
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[55] overflow-hidden"
      style={{
        pointerEvents: opening ? 'none' : 'auto',
        opacity: opening ? 0 : 1,
        transition: opening ? 'opacity .6s ease 1.3s' : undefined,
      }}
    >
      {/* Sheet with the opening; only seen once the solid ground fades at the exit. */}
      {c && (
        <div
          className="absolute"
          style={{
            left: c.cx - sheet / 2,
            top: c.cy - sheet / 2,
            width: sheet,
            height: sheet,
            background: `radial-gradient(circle at 50% 50%, rgba(239,235,226,0) 0, rgba(239,235,226,0) 40px, ${PAPER} 170px)`,
            animation: opening ? `nr-intro-open 1.2s ${OPEN_EASE} both` : undefined,
          }}
        />
      )}
      {/* Paper ground — what the dark ground inverts to */}
      <div
        className="absolute inset-0"
        style={{ background: PAPER, animation: opening ? 'nr-intro-fade .35s ease both' : undefined }}
      />
      {/* Dark ground while loading; fades to the paper at the inversion */}
      <div
        className="absolute inset-0"
        style={{ background: INTRO_GROUND, animation: inverted ? `nr-intro-fade ${invert}` : undefined }}
      />

      {layout && (
        <>
          {/* Opera Senza imprint. Static filters; only the wrappers move. On the dark
              ground a faint light impression; at the inversion it crossfades into the
              same crest pressed into the paper (light lower edge, darker upper one). */}
          <div
            className="absolute"
            style={{
              left: layout.crest.cx - layout.crest.w / 2,
              top: layout.crest.cy - layout.crest.h / 2,
              width: layout.crest.w,
              animation: opening
                ? `nr-intro-fade 1.8s ease both`
                : `nr-intro-imprint-in 1.6s ${EASE} .1s both`,
            }}
          >
            <div style={{ animation: inverted ? `nr-intro-fade ${invert}` : undefined }}>
              <Image
                src={crestSrc}
                alt=""
                width={1192}
                height={1328}
                priority
                className="block h-auto w-full"
                style={{
                  opacity: 0.14,
                  mixBlendMode: 'screen',
                  filter:
                    'grayscale(1) brightness(1.5) contrast(.85) ' +
                    'drop-shadow(0 -1px 0 rgba(255,255,255,.35)) drop-shadow(0 1px 0 rgba(40,38,34,.3))',
                }}
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ opacity: 0, animation: inverted ? `nr-intro-fill ${invert}` : undefined }}
            >
              <Image
                src={crestSrc}
                alt=""
                width={1192}
                height={1328}
                className="block h-auto w-full"
                style={{
                  opacity: 0.16,
                  mixBlendMode: 'multiply',
                  filter:
                    'grayscale(1) contrast(.8) brightness(1.2) ' +
                    'drop-shadow(0 1px 0 rgba(255,255,255,.8)) drop-shadow(0 -1px 0 rgba(60,56,50,.25))',
                }}
              />
            </div>
          </div>

          {/* NINA ROSSI — outline first, then a soft left-to-right fill, letter by letter */}
          <p
            className="absolute m-0 whitespace-nowrap"
            style={{
              left: layout.name.left,
              top: layout.name.top,
              width: layout.name.width,
              textAlign: layout.name.align,
              fontFamily: 'var(--font-sans)',
              fontSize: layout.name.fontSize,
              lineHeight: 1,
              letterSpacing: '.02em',
            }}
          >
            {words.map((w, wi) => (
              <React.Fragment key={w.text}>
                {wi > 0 && ' '}
                <span className="inline-block" style={{ fontWeight: w.weight }}>
                  {[...w.text].map((ch, li) => {
                    const i = offsets[wi] + li
                    const outlineAt = 0.15 + wi * 0.4 + li * 0.03
                    const fillAt = 0.7 + wi * 0.4 + i * 0.07
                    return (
                      <span key={li} className="relative inline-block">
                        <span
                          className="block"
                          style={{
                            color: 'transparent',
                            WebkitTextStroke: '1px rgba(239,235,226,.4)',
                            animation: `nr-intro-outline 1.1s ease ${outlineAt.toFixed(2)}s both`,
                          }}
                        >
                          {ch}
                        </span>
                        <span
                          className="absolute inset-0 block"
                          style={{ color: PAPER, animation: `nr-intro-fill .9s ease ${fillAt.toFixed(2)}s both` }}
                        >
                          {ch}
                        </span>
                        {/* Ink copy over the paper fill — fades in at the inversion */}
                        <span
                          className="absolute inset-0 block"
                          style={{ color: INK, opacity: 0, animation: inverted ? `nr-intro-fill ${invert}` : undefined }}
                        >
                          {ch}
                        </span>
                      </span>
                    )
                  })}
                </span>
              </React.Fragment>
            ))}
          </p>

          {/* First role — rolls in word by word after the name, over the hero's own, which
              is already in place underneath when the intro opens. Paper, then ink. */}
          <p
            ref={rolesCopyRef}
            className="absolute m-0 grid"
            style={{
              left: layout.roles.left,
              top: layout.roles.top,
              width: layout.roles.width,
              justifyItems: layout.roles.justify,
              fontFamily: 'var(--font-sans)',
              fontSize: layout.roles.fontSize,
              fontWeight: layout.roles.fontWeight,
              lineHeight: 1,
              letterSpacing: '.01em',
            }}
          >
            <span className="whitespace-nowrap">
              {role.split(' ').map((w, wi) => (
                <React.Fragment key={wi}>
                  {wi > 0 && ' '}
                  <span className="relative inline-block overflow-hidden align-top" style={{ paddingBottom: '.14em' }}>
                    <span
                      className="relative inline-block"
                      style={{ color: PAPER, animation: `nr-word-in .9s ${EASE} ${(ROLE_AT + wi * 0.062).toFixed(2)}s both` }}
                    >
                      {w}
                      <span
                        className="absolute inset-0"
                        style={{ color: INK, opacity: 0, animation: inverted ? `nr-intro-fill ${invert}` : undefined }}
                      >
                        {w}
                      </span>
                    </span>
                  </span>
                </React.Fragment>
              ))}
            </span>
          </p>
        </>
      )}

      {/* Getting ready */}
      <div
        className="absolute left-1/2 flex flex-col items-center"
        style={{
          bottom: 'clamp(32px, 8vh, 72px)',
          gap: 'clamp(12px, 1.6vh, 18px)',
          translate: '-50% 0',
          animation: inverted ? `nr-intro-foot-out .6s ${EASE} both` : `nr-intro-foot-in 1s ${EASE} .5s both`,
        }}
      >
        <div
          className="flex items-center gap-3 uppercase"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', letterSpacing: '.22em', color: PAPER_SOFT }}
        >
          <span className="block h-px w-[26px]" style={{ background: PAPER_FAINT }} />
          <span>Getting ready</span>
          <span className="block h-px w-[26px]" style={{ background: PAPER_FAINT }} />
          <span style={{ color: PAPER, letterSpacing: '.1em', fontVariantNumeric: 'tabular-nums', minWidth: '4ch' }}>
            {String(count).padStart(3, '0')}%
          </span>
        </div>
        <p
          className="m-0 grid"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 100, fontSize: 'clamp(20px, 2.2vw, 30px)', lineHeight: 1, color: PAPER }}
        >
          {PHRASES.map((p, pi) => {
            const state = pi === phrase ? 'in' : pi < phrase ? 'out' : 'idle'
            return (
              <span key={p} className="whitespace-nowrap text-center" style={{ gridArea: '1 / 1' }}>
                {p.split(' ').map((w, wi) => (
                  <React.Fragment key={wi}>
                    {wi > 0 && ' '}
                    <span className="relative inline-block overflow-hidden align-top" style={{ paddingBottom: '.14em' }}>
                      <span
                        className="inline-block"
                        style={
                          state === 'in'
                            ? { animation: `nr-word-in .88s ${EASE} ${(pi === 0 ? 0.7 : 0) + wi * 0.062}s both` }
                            : state === 'out'
                              ? { transform: 'translateY(-115%)', animation: `nr-word-out .42s cubic-bezier(.65,0,.35,1) ${wi * 0.036}s both` }
                              : { transform: 'translateY(115%)' }
                        }
                      >
                        {w}
                      </span>
                    </span>
                  </React.Fragment>
                ))}
              </span>
            )
          })}
        </p>
      </div>
    </div>
  )
}
