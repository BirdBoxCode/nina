'use client'

import React, { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { FLOWER_PETALS, FLOWER_R } from '@/lib/flower'
import { PIGMENT } from '@/lib/palette'

/**
 * The artist's flower icons, rebuilt as layered vectors from the Paper drawing and coloured
 * from the original PNGs (sampled per icon, per petal, and by distance from the centre).
 *
 * Layers, inside out: eight petals (the outline cut at its notches, each petal in its own
 * sampled colour, meeting its neighbours in a shared tone toward the centre), then over
 * each petal the shared blends: the body (olive centre into the grey ring), the lit centre
 * (olive brightening to sage) and the glow (petals lifting toward the wordmark lavender).
 * Edges stay crisp; only the colour is blended.
 *
 * Petals open by scaling about the centre, so neighbours stay overlapped at the middle and
 * never part. Turning is applied to all eight together for the same reason.
 */

export type FlowerVariant = 'purple' | 'green'
export type FlowerState = 'closed' | 'open' | 'hover' | 'playing'

type Tone = {
  /** Body gradient from the centre out: [radius / R, colour]. Fades out past the ring. */
  body: [number, string][]
  /** The olive centre's offset from the middle, in units of R (the PNGs are off-centre). */
  focus: [number, number]
  /** Petal colours, NW, N, NE, E, SE, S, SW, W (the order of the wedges below). */
  petals: string[]
}

const all = (c: string) => Array<string>(8).fill(c)

/** The average of some #RRGGBB colours: where a flower's petals meet toward the centre. */
function mix(colours: readonly string[]) {
  const sum = [0, 0, 0]
  for (const c of colours) for (let k = 0; k < 3; k++) sum[k] += parseInt(c.slice(1 + k * 2, 3 + k * 2), 16)
  return '#' + sum.map((v) => Math.round(v / colours.length).toString(16).padStart(2, '0')).join('')
}

/** Sampled from public/images/assets/icons/{purple,green}-icons.png, top to bottom. */
const TONES: Record<FlowerVariant, Tone[]> = {
  purple: [
    {
      body: [[0.08, '#93947C'], [0.16, '#949581'], [0.24, '#97988B'], [0.32, '#9E9FA2'], [0.4, '#A2A2AF'], [0.48, '#A4A4B7'], [0.56, '#A7A8C2']],
      focus: [-0.034, -0.011],
      petals: all('#AAAACA'),
    },
    {
      body: [[0.08, '#909174'], [0.16, '#919277'], [0.24, '#94957F'], [0.32, '#9B9C99'], [0.4, '#A1A1AC'], [0.48, '#A2A2B1'], [0.56, '#A5A5BA']],
      focus: [0.034, -0.08],
      petals: ['#AAAACA', '#AAAACA', '#A9AAC9', '#A9A9C6', '#A7A7C2', '#A6A6BE', '#A6A7C1', '#A9A9C8'],
    },
    {
      body: [[0.08, '#919275'], [0.16, '#929379'], [0.24, '#949581'], [0.32, '#9A9B94'], [0.4, '#A0A0A9'], [0.48, '#A2A2B0'], [0.56, '#A4A4B5']],
      focus: [-0.08, 0.011],
      petals: ['#A2A2B1', '#A4A4B6', '#A7A7C2', '#AAAACA', '#A9A9C9', '#A3A3B2', '#A2A3B0', '#A2A2AF'],
    },
  ],
  green: [
    {
      body: [[0.08, '#919274'], [0.16, '#919275'], [0.24, '#929378'], [0.32, '#93947D'], [0.4, '#949580'], [0.48, '#959682'], [0.56, '#959684']],
      focus: [-0.09, -0.034],
      petals: all('#969786'),
    },
    {
      body: [[0.08, '#909172'], [0.16, '#909173'], [0.24, '#919275'], [0.32, '#93937B'], [0.4, '#94957F'], [0.48, '#949581'], [0.56, '#959682']],
      focus: [-0.09, -0.08],
      petals: ['#969786', '#969786', '#969786', '#969785', '#959684', '#959684', '#959685', '#969786'],
    },
    {
      body: [[0.08, '#909173'], [0.16, '#909173'], [0.24, '#919275'], [0.32, '#92937A'], [0.4, '#94957F'], [0.48, '#949580'], [0.56, '#949582']],
      focus: [-0.136, 0.023],
      petals: ['#949580', '#949581', '#959684', '#969786', '#969786', '#949581', '#949580', '#949580'],
    },
  ],
}

/** The body blend reaches this far out (in R); past it the petals show their own colour. */
const BODY_R = 0.64
/** How opaque the body is at each sampled radius: solid through the ring, then fading. */
const bodyAlpha = (r: number) => (r <= 0.32 ? 1 : Math.max(0, 1 - (r - 0.32) / (BODY_R - 0.32)))

/** Lit centre: olive brightening toward sage. */
const LIT = '#B0B394'
/** Glow: petals lifting toward the wordmark lavender (purple) or the sage mist (green). */
const GLOW: Record<FlowerVariant, string> = { purple: PIGMENT.lavenderMist, green: PIGMENT.sageMist }

const PETAL_SCALE: Record<FlowerState, number> = { closed: 1, open: 1.045, hover: 1.035, playing: 1.02 }
const TURN: Record<FlowerState, number> = { closed: 0, open: 3, hover: 2, playing: 0 }
const EASE = 'cubic-bezier(.22,1,.36,1)'
/** One full turn while playing. */
const SPIN_MS = 40000

/** Half the box: a little past the petal tips, so an open flower isn't clipped. */
const BOX = 182

export function FlowerIcon({
  variant,
  index = 0,
  state = 'closed',
  delay = 0,
  className,
  style,
}: {
  variant: FlowerVariant
  /** Which flower of the strip (0 = top), for its own colouring and breathing offset. */
  index?: 0 | 1 | 2
  state?: FlowerState
  /** ms before this flower follows a state change; staggers a strip. */
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `fl-${uid}-${name}`
  const tone = TONES[variant][index]
  const reduced = useReducedMotion() ?? false
  const moving = !reduced
  const turnRef = useRef<SVGGElement | null>(null)

  // Playing: the petals turn slowly. On stopping they settle back the short way.
  const playing = state === 'playing' && moving
  const spin = useRef<Animation | null>(null)
  useIsoLayoutEffect(() => {
    const el = turnRef.current
    if (!el || typeof el.animate !== 'function') return
    if (playing) {
      spin.current?.cancel()
      spin.current = el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
        duration: SPIN_MS,
        iterations: Infinity,
      })
      return
    }
    const run = spin.current
    if (!run) return
    spin.current = null
    const t = Number(run.currentTime ?? 0)
    const angle = ((t % SPIN_MS) / SPIN_MS) * 360
    run.cancel()
    const to = angle > 180 ? 360 : 0
    const travel = Math.abs(to - angle)
    if (travel < 0.5) return
    el.animate([{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${to}deg)` }], {
      duration: 700 + (travel / 180) * 1300,
      easing: 'cubic-bezier(.33,0,.2,1)',
    })
  }, [playing])
  useEffect(() => () => spin.current?.cancel(), [])

  const lit = state === 'closed' ? 0 : 1
  const glow = state === 'closed' ? 0 : state === 'playing' ? 0.35 : 0.55
  const fade = (ms: number) => `opacity ${ms}ms ease ${delay}ms`

  const R = FLOWER_R

  return (
    <svg
      viewBox={`${-BOX} ${-BOX} ${BOX * 2} ${BOX * 2}`}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1', overflow: 'visible', ...style }}
    >
      <defs>
        {tone.petals.map((c, i) => (
          <radialGradient key={i} id={id(`p${i}`)} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
            <stop offset=".42" stopColor={mix(tone.petals)} />
            <stop offset=".7" stopColor={c} />
          </radialGradient>
        ))}
        <radialGradient id={id('body')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R * BODY_R} fx={tone.focus[0] * R} fy={tone.focus[1] * R}>
          <stop offset="0" stopColor={tone.body[0][1]} />
          {tone.body.map(([r, c]) => (
            <stop key={r} offset={(r / BODY_R).toFixed(3)} stopColor={c} stopOpacity={bodyAlpha(r).toFixed(2)} />
          ))}
          <stop offset="1" stopColor={tone.body[tone.body.length - 1][1]} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('lit')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R * 0.4}>
          <stop offset="0" stopColor={LIT} />
          <stop offset=".45" stopColor={LIT} stopOpacity=".85" />
          <stop offset="1" stopColor={LIT} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('glow')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={R}>
          <stop offset=".3" stopColor={GLOW[variant]} stopOpacity="0" />
          <stop offset=".62" stopColor={GLOW[variant]} stopOpacity=".85" />
          <stop offset="1" stopColor={GLOW[variant]} />
        </radialGradient>
      </defs>

      <g
        style={
          moving
            ? { animation: `nr-flower-breathe 14s ease-in-out ${(-index * 4.6).toFixed(1)}s infinite` }
            : undefined
        }
      >
        <g
          ref={turnRef}
          data-layer="petals"
          style={{
            transform: moving ? `rotate(${TURN[state]}deg)` : 'none',
            transition: `transform .9s ${EASE} ${delay}ms`,
          }}
        >
          {FLOWER_PETALS.map((d, i) => (
            <g
              key={i}
              data-petal={i}
              style={{
                transform: moving ? `scale(${PETAL_SCALE[state]})` : 'none',
                transition: `transform .8s ${EASE} ${delay + i * 28}ms`,
              }}
            >
              <path d={d} fill={`url(#${id(`p${i}`)})`} />
              <path d={d} fill={`url(#${id('body')})`} data-layer="ring" />
              <path d={d} fill={`url(#${id('lit')})`} data-layer="centre" style={{ opacity: lit, transition: fade(600) }} />
              <path d={d} fill={`url(#${id('glow')})`} data-layer="glow" style={{ opacity: glow, transition: fade(700) }} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  )
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Where each flower sits in the original strip PNGs (77 × 247): centre y, as a share of the height. */
const STRIP_Y = [0.152, 0.5, 0.844]
/** Flower width as a share of the strip's width (the Paper strip: 364 of 401). */
const STRIP_W = 0.907

/**
 * The three-flower column, laid out exactly as the strip PNG was (same box, same centres),
 * so it drops into the PNG's place without moving anything around it.
 */
export function FlowerStrip({
  variant,
  state = 'closed',
  stagger = 70,
  className,
  style,
}: {
  variant: FlowerVariant
  state?: FlowerState
  /** ms between one flower and the next following a state change. */
  stagger?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span className={className} style={{ position: 'relative', display: 'block', aspectRatio: '77 / 247', ...style }}>
      {STRIP_Y.map((y, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: `${y * 100}%`,
            width: `${STRIP_W * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <FlowerIcon variant={variant} index={i as 0 | 1 | 2} state={state} delay={i * stagger} />
        </span>
      ))}
    </span>
  )
}
