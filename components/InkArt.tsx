'use client'

import React, { useEffect, useId, useState } from 'react'
import { preload } from 'react-dom'

/**
 * Line art from /public/images/assets/svg, drawn inline so its colour comes from CSS
 * (`currentColor`) and its path can double as its own draw-in mask.
 *
 * The drawings are traced outlines (filled shapes), not strokes, so the art itself can't
 * be dash-animated. Instead each outline is stroked again, wide, inside a mask, and that
 * stroke's dash is run from 1 to 0: the fill appears along the lines as if inked in.
 * The art keeps its box from `ratio` before the file arrives, so nothing shifts.
 */

type Art = { viewBox: string; d: string; parts: string[] }

const cache = new Map<string, Promise<Art>>()

function load(src: string): Promise<Art> {
  let p = cache.get(src)
  if (!p) {
    p = fetch(src)
      .then((r) => r.text())
      .then((text) => {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
        const svg = doc.documentElement
        const d = Array.from(doc.querySelectorAll('path'))
          .map((el) => el.getAttribute('d') ?? '')
          .join(' ')
        // Every subpath starts with an absolute M (checked on export), one mask stroke each.
        const parts = d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean)
        return { viewBox: svg.getAttribute('viewBox') ?? '0 0 100 100', d, parts }
      })
    // A failed fetch is dropped so a later mount can try again.
    p.catch(() => cache.delete(src))
    cache.set(src, p)
  }
  return p
}

export type InkDraw = {
  /** CSS time the drawing starts at, e.g. '1.30s'. */
  delay: string
  /** Seconds for each line to ink in. */
  duration: number
  /** Seconds between one line starting and the next. */
  stagger?: number
  /** Mask stroke width in the art's own units; wide enough to cover a line's thickness. */
  width?: number
}

export function InkArt({
  src,
  ratio,
  draw,
  className,
  style,
  fit = 'width',
}: {
  src: string
  /** width / height of the art, holding its box until it has loaded. */
  ratio: number
  /** Ink the lines in on mount; omit to show the art drawn. */
  draw?: InkDraw
  className?: string
  style?: React.CSSProperties
  /** 'width' fills the width (height follows); 'height' fills the height. */
  fit?: 'width' | 'height'
}) {
  preload(src, { as: 'fetch', crossOrigin: 'anonymous' })
  const [art, setArt] = useState<Art | null>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    let live = true
    load(src)
      .then((a) => live && setArt(a))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [src])

  const box: React.CSSProperties =
    fit === 'width'
      ? { display: 'block', width: '100%', height: 'auto', aspectRatio: String(ratio) }
      : { display: 'block', height: '100%', width: 'auto', aspectRatio: String(ratio) }

  return (
    <svg
      viewBox={art?.viewBox ?? `0 0 ${ratio * 100} 100`}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ ...box, overflow: 'visible', ...style }}
    >
      {art && draw && (
        <defs>
          <mask id={`ink-${id}`}>
            {art.parts.map((part, i) => (
              <path
                key={i}
                d={part}
                className="nr-ink-mask"
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth={draw.width ?? 30}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation:
                    `nr-ink-draw ${draw.duration}s cubic-bezier(.45,.05,.25,1) ` +
                    `calc(${draw.delay} + ${((draw.stagger ?? 0) * i).toFixed(2)}s) both`,
                }}
              />
            ))}
          </mask>
        </defs>
      )}
      {art && (
        <path d={art.d} fill="currentColor" fillRule="evenodd" mask={draw ? `url(#ink-${id})` : undefined} />
      )}
    </svg>
  )
}
