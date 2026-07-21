'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const PANEL = '#3A2F63'
const LINE = '#FBFFFF'

/** Wipe in, draw the line, swap the route, wipe out. Durations in seconds. */
const COVER_MS = 550
const LINE_MS = 500
const REVEAL_MS = 550

type Phase = 'idle' | 'cover' | 'hold' | 'reveal'

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
export const REVEAL_CLEAR_DELAY = (LINE_MS + REVEAL_MS) / 1000

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const navigate = useCallback(
    (href: string) => {
      // Ignore clicks fired while a transition is already running.
      if (phase !== 'idle') return

      setPhase('cover')

      timers.current.push(
        setTimeout(() => {
          setPhase('hold')
          // Swap the route while the panel fully covers the viewport.
          router.push(href)
        }, COVER_MS)
      )

      timers.current.push(
        setTimeout(() => setPhase('reveal'), COVER_MS + LINE_MS)
      )

      timers.current.push(
        setTimeout(() => setPhase('idle'), COVER_MS + LINE_MS + REVEAL_MS)
      )
    },
    [phase, router]
  )

  const covered = phase === 'cover' || phase === 'hold'

  return (
    <TransitionContext.Provider value={navigate}>
      <CoveredContext.Provider value={covered}>{children}</CoveredContext.Provider>

      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            key="page-transition"
            className="fixed inset-0 z-[200] pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: covered ? '0%' : '100%' }}
            transition={{
              duration: (covered ? COVER_MS : REVEAL_MS) / 1000,
              ease: [0.76, 0, 0.24, 1],
            }}
            style={{ backgroundColor: PANEL }}
          >
            {/* Hairline that draws out from the centre while the panel holds */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="h-px w-[240px] origin-center"
                style={{ backgroundColor: LINE }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  covered
                    ? { scaleX: 1, opacity: 0.9 }
                    : { scaleX: 0, opacity: 0 }
                }
                transition={{
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                  delay: covered ? COVER_MS / 1000 - 0.15 : 0,
                }}
              />
            </div>
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
