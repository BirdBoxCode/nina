'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const PANEL = '#BBBB89'
/* The crest rides the panel as a paper-coloured cut-out. */
const CUTOUT = '#EFEBE2'
const CREST = '/images/assets/opera-senza.png'
const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1]

/** Wipe in, carry the crest to its new spot, swap the route, wipe out. Durations in ms. */
const COVER_MS = 550
const HOLD_MS = 600
const REVEAL_MS = 550
/* The crest's glide to its spot on the new page, inside the hold. */
const GLIDE_MS = 450

type Phase = 'idle' | 'cover' | 'hold' | 'reveal'
type Box = { left: number; top: number; width: number; height: number }

const TransitionContext = createContext<(href: string) => void>(() => {})

/** True while the panel is covering the viewport — i.e. a new page mounting now is hidden. */
const CoveredContext = createContext(false)

export function usePageTransition() {
  return useContext(TransitionContext)
}

export function useTransitionCovered() {
  return useContext(CoveredContext)
}

/** Seconds a page mounting under the panel must wait before its reveal is visible. */
export const REVEAL_CLEAR_DELAY = (HOLD_MS + REVEAL_MS) / 1000

/**
 * Crests that take part in the transition carry `data-transition-crest`: the home hero
 * crest and the nav-bar crest. Returns the first one actually showing on screen.
 */
function findCrest(exclude?: Set<Element>): { el: Element; box: Box } | null {
  const vw = window.innerWidth
  const vh = window.innerHeight
  for (const el of document.querySelectorAll('[data-transition-crest]')) {
    if (exclude?.has(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue
    if (getComputedStyle(el).opacity === '0') continue
    return { el, box: { left: r.left, top: r.top, width: r.width, height: r.height } }
  }
  return null
}

/** No crest on screen: start from the middle of the viewport. */
function centreBox(): Box {
  const width = Math.min(window.innerWidth * 0.3, 220)
  const height = width * (1328 / 1192)
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  }
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  // Where the cut-out sits: `from` is the crest on the page being left, `to` its spot on
  // the page arriving (null until that page has mounted under the panel).
  const [from, setFrom] = useState<Box | null>(null)
  const [to, setTo] = useState<Box | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const frame = useRef(0)

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      cancelAnimationFrame(frame.current)
    }
  }, [])

  const navigate = useCallback(
    (href: string) => {
      // Ignore clicks fired while a transition is already running.
      if (phase !== 'idle') return

      // Every crest on the outgoing page, so the search below only accepts a new one.
      const outgoing = new Set(document.querySelectorAll('[data-transition-crest]'))
      setFrom(findCrest()?.box ?? centreBox())
      setTo(null)
      setPhase('cover')

      timers.current.push(
        setTimeout(() => {
          setPhase('hold')
          // Swap the route while the panel fully covers the viewport.
          router.push(href)

          // Watch for the new page's crest; once it mounts, the cut-out glides onto it.
          // Give up in time for the glide to finish before the reveal.
          const deadline = performance.now() + HOLD_MS - GLIDE_MS
          const look = () => {
            const found = findCrest(outgoing)
            if (found) setTo(found.box)
            else if (performance.now() < deadline) frame.current = requestAnimationFrame(look)
          }
          frame.current = requestAnimationFrame(look)
        }, COVER_MS)
      )

      timers.current.push(
        setTimeout(() => setPhase('reveal'), COVER_MS + HOLD_MS)
      )

      timers.current.push(
        setTimeout(() => setPhase('idle'), COVER_MS + HOLD_MS + REVEAL_MS)
      )
    },
    [phase, router]
  )

  const covered = phase === 'cover' || phase === 'hold'
  const crest = to ?? from

  return (
    <TransitionContext.Provider value={navigate}>
      <CoveredContext.Provider value={covered}>{children}</CoveredContext.Provider>

      <AnimatePresence>
        {phase !== 'idle' && (
          // The panel stays put and its edge sweeps across (clip-path), rather than the
          // panel sliding: so the crest inside holds its place on screen, and the edge
          // turns it to a cut-out as it passes on the way in, and back on the way out.
          <motion.div
            key="page-transition"
            className="fixed inset-0 z-[200] pointer-events-none"
            initial={{ clipPath: 'inset(0% 100% 0% 0%)' }}
            animate={{ clipPath: covered ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)' }}
            transition={{ duration: (covered ? COVER_MS : REVEAL_MS) / 1000, ease: EASE }}
            style={{ backgroundColor: PANEL }}
          >
            {crest && (
              <motion.div
                aria-hidden="true"
                className="absolute left-0 top-0"
                initial={false}
                animate={crest}
                transition={{ duration: GLIDE_MS / 1000, ease: EASE }}
                style={{
                  backgroundColor: CUTOUT,
                  WebkitMaskImage: `url(${CREST})`,
                  maskImage: `url(${CREST})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  )
}

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

/** Anchor that routes through the wipe instead of navigating immediately. */
export function TransitionLink({ href, children, onClick, ...rest }: TransitionLinkProps) {
  const navigate = usePageTransition()

  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e)
        // Let modified clicks (new tab, download) behave natively.
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(href)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
