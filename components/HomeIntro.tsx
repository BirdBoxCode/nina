'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/*
 * Home intro. Covers the hero on a full page load (first visit or refresh, never on an
 * in-app navigation) while the 3D pieces build, then opens onto it.
 *
 * Paper ground, a faint imprint of the Opera Senza crest and NINA ROSSI drawn in outline
 * then filled, each placed exactly where the hero's own crest and name sit, so the hand-off
 * lands in place. Below, a "Getting ready" counter and a rolling status line.
 *
 * Every moving part animates opacity or transform only, so the browser can keep it smooth
 * while the main thread is busy building the 3D. The counter is the exception (it is text).
 */

/* Shared with NinaroHome's tokens; kept here to avoid a circular import. */
const PAPER = '#EFEBE2'
const INK = '#76736B'
const MUTED_LIGHT = '#8F8B82'
const RULE_LIGHT = '#D6D2C9'
const EASE = 'cubic-bezier(.22,1,.36,1)'
const OPEN_EASE = 'cubic-bezier(.76,0,.24,1)'

/* Shown at least this long so it never flashes, and never longer than the cap. */
const MIN_MS = 1800
const MAX_MS = 4500
/* Exit: the paper opens from the crest; the layer is removed once it has faded. */
const EXIT_MS = 1400

const PHRASES = ['Preparing the paper', 'Mixing the ink', 'Opening the studio']

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
}

export function HomeIntro({
  progress,
  measure,
  words,
  crestSrc,
  onOpen,
}: {
  /** 0..1 — share of the things the hero waits on that are ready. */
  progress: number
  /** Where the hero's crest and name rest, in viewport px; null until laid out. */
  measure: () => IntroLayout | null
  words: readonly { text: string; weight: number }[]
  crestSrc: string
  /** Called as the paper starts to open: the hero's entrance starts here. */
  onOpen: () => void
}) {
  const [layout, setLayout] = useState<IntroLayout | null>(null)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'opening' | 'gone'>('loading')
  const progressRef = useRef(progress)
  const onOpenRef = useRef(onOpen)
  const measureRef = useRef(measure)

  useEffect(() => {
    progressRef.current = progress
    onOpenRef.current = onOpen
    measureRef.current = measure
  })

  // Place the imprint and the name over their hero counterparts; again on resize.
  useEffect(() => {
    let frame = requestAnimationFrame(() => setLayout(measureRef.current()))
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setLayout(measureRef.current()))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // No scrolling under the intro.
  useEffect(() => {
    if (phase !== 'loading') return
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
        setPhase('opening')
        onOpenRef.current()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (phase !== 'opening') return
    const id = setTimeout(() => setPhase('gone'), EXIT_MS)
    return () => clearTimeout(id)
  }, [phase])

  if (phase === 'gone') return null

  const opening = phase === 'opening'
  const phrase = count >= 100 ? 2 : count >= 55 ? 1 : 0
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
        transition: opening ? 'opacity .45s ease .8s' : undefined,
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
      {/* Solid ground */}
      <div
        className="absolute inset-0"
        style={{ background: PAPER, animation: opening ? 'nr-intro-fade .35s ease both' : undefined }}
      />

      {layout && (
        <>
          {/* Opera Senza imprint — pressed into the paper: faint, a light lower edge and a
              darker upper one. Static filters; only the wrapper moves. */}
          <div
            className="absolute"
            style={{
              left: layout.crest.cx - layout.crest.w / 2,
              top: layout.crest.cy - layout.crest.h / 2,
              width: layout.crest.w,
              animation: opening
                ? `nr-intro-imprint-out 1s ${EASE} both`
                : `nr-intro-imprint-in 1.6s ${EASE} .1s both`,
            }}
          >
            <Image
              src={crestSrc}
              alt=""
              width={1192}
              height={1328}
              priority
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
              animation: opening ? `nr-intro-name-out .55s ${EASE} both` : undefined,
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
                            WebkitTextStroke: '1px rgba(118,115,107,.4)',
                            animation: `nr-intro-outline 1.1s ease ${outlineAt.toFixed(2)}s both`,
                          }}
                        >
                          {ch}
                        </span>
                        <span
                          className="absolute inset-0 block"
                          style={{ color: INK, animation: `nr-intro-fill .9s ease ${fillAt.toFixed(2)}s both` }}
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
        </>
      )}

      {/* Getting ready */}
      <div
        className="absolute left-1/2 flex flex-col items-center"
        style={{
          bottom: 'clamp(32px, 8vh, 72px)',
          gap: 'clamp(12px, 1.6vh, 18px)',
          translate: '-50% 0',
          animation: opening ? `nr-intro-foot-out .45s ${EASE} both` : `nr-intro-foot-in 1s ${EASE} .5s both`,
        }}
      >
        <div
          className="flex items-center gap-3 uppercase"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '10.5px', letterSpacing: '.22em', color: MUTED_LIGHT }}
        >
          <span className="block h-px w-[26px]" style={{ background: RULE_LIGHT }} />
          <span>Getting ready</span>
          <span className="block h-px w-[26px]" style={{ background: RULE_LIGHT }} />
          <span style={{ color: INK, letterSpacing: '.1em', fontVariantNumeric: 'tabular-nums', minWidth: '4ch' }}>
            {String(count).padStart(3, '0')}%
          </span>
        </div>
        <p
          className="m-0 grid"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 100, fontSize: 'clamp(20px, 2.2vw, 30px)', lineHeight: 1, color: INK }}
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
