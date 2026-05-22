'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useIntro } from './IntroContext'

// ninaro: 400×135 → displayed at 257px wide
const NINA_W = 257
const NINA_H = Math.round(NINA_W * (135 / 400)) // 87px
// wings: 1009×431 → scale proportionally to ninaro display size
const WINGS_W = Math.round(NINA_W * (1009 / 400)) // 648px

export function IntroOverlay() {
  const { showContent, setCursorOverride } = useIntro()
  const [overlayVisible, setOverlayVisible] = useState(true)

  const overlayRef = useRef<HTMLDivElement>(null)
  const ninaContainerRef = useRef<HTMLDivElement>(null)
  const ninaRef = useRef<HTMLDivElement>(null)
  const wingsRef = useRef<HTMLImageElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const artistRef = useRef<HTMLSpanElement>(null)
  const colonRef = useRef<HTMLSpanElement>(null)
  const tattooistRef = useRef<HTMLSpanElement>(null)
  const tlHRef = useRef<HTMLDivElement>(null)
  const tlVRef = useRef<HTMLDivElement>(null)
  const brHRef = useRef<HTMLDivElement>(null)
  const brVRef = useRef<HTMLDivElement>(null)

  const mouseRef = useRef({ x: 0, y: 0 })
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (sessionStorage.getItem('introPlayed')) {
      showContent()
      setOverlayVisible(false)
      return
    }

    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove)

    const W = window.innerWidth
    const H = window.innerHeight

    const t = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay)
      timeoutsRef.current.push(id)
      return id
    }

    // Step 1 — ninaro fade in + scale up
    t(() => {
      if (ninaRef.current) {
        ninaRef.current.style.opacity = '1'
        ninaRef.current.style.transform = 'scale(1)'
      }
    }, 50)

    // Step 1 — cursor flies in from top-right off-screen
    setCursorOverride({ x: W + 150, y: -150 })

    // Cursor wanders around screen center for ~4s via waypoints (scaled ~2.1× from original)
    const cursorWaypoints: [number, number, number][] = [
      [ 150, W * 0.88, H * 0.12],
      [ 730, W * 0.70, H * 0.28],
      [1090, W * 0.52, H * 0.42],
      [1420, W * 0.36, H * 0.38],
      [1740, W * 0.38, H * 0.54],
      [2030, W * 0.56, H * 0.50],
      [2320, W * 0.45, H * 0.44],
      [2640, W * 0.54, H * 0.53],
      [2960, W * 0.48, H * 0.47],
      [3360, W * 0.51, H * 0.51],
      [3780, W * 0.50, H * 0.50],
    ]
    cursorWaypoints.forEach(([delay, x, y]) => {
      t(() => setCursorOverride({ x, y }), delay)
    })

    // Step 2 — wings fade in (800ms)
    t(() => {
      if (wingsRef.current) wingsRef.current.style.opacity = '1'
    }, 800)

    // Step 3 — text sequence (1200ms)
    t(() => {
      if (artistRef.current) {
        artistRef.current.style.opacity = '1'
        artistRef.current.style.transform = 'translateX(0)'
      }
    }, 1200)
    t(() => {
      if (colonRef.current) {
        colonRef.current.style.opacity = '1'
        colonRef.current.style.transform = 'translateY(0)'
      }
    }, 1600)
    t(() => {
      if (tattooistRef.current) {
        tattooistRef.current.style.opacity = '1'
        tattooistRef.current.style.transform = 'translateX(0)'
      }
    }, 2000)

    // Step 4 — corner brackets animate in (2500ms, 0.3s duration)
    t(() => {
      if (tlHRef.current) tlHRef.current.style.width = '20px'
      if (tlVRef.current) tlVRef.current.style.height = '20px'
      if (brHRef.current) brHRef.current.style.width = '20px'
      if (brVRef.current) brVRef.current.style.height = '20px'
    }, 2500)

    // Brackets animate back out after 0.9s hold (3700ms: in at 2500, anim 0.3s → done 2800, hold 0.9s → out 3700)
    t(() => {
      if (tlHRef.current) tlHRef.current.style.width = '0px'
      if (tlVRef.current) tlVRef.current.style.height = '0px'
      if (brHRef.current) brHRef.current.style.width = '0px'
      if (brVRef.current) brVRef.current.style.height = '0px'
    }, 3700)

    // Step 5 — cursor transitions to real mouse position (4000ms)
    t(() => {
      setCursorOverride({ ...mouseRef.current })
      t(() => setCursorOverride(null), 200)
    }, 4000)

    // Step 6 — wings + text fade out, background transitions to #FBFFFF (4400ms)
    t(() => {
      if (wingsRef.current) wingsRef.current.style.opacity = '0'
      if (textContainerRef.current) textContainerRef.current.style.opacity = '0'
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'background-color 0.4s ease'
        overlayRef.current.style.backgroundColor = '#FBFFFF'
      }
    }, 4400)

    // Step 7 — ninaro shifts to final position, overlay fades, content appears (5600ms)
    // Background transition completes at 4800ms; 5600ms gives 800ms breathing room after
    t(() => {
      const homepageNinaro = document.getElementById('homepage-ninaro')
      const introNinaro = ninaContainerRef.current

      if (homepageNinaro && introNinaro && ninaRef.current) {
        const homeRect = homepageNinaro.getBoundingClientRect()
        const introRect = introNinaro.getBoundingClientRect()
        const deltaY = homeRect.top - introRect.top
        ninaRef.current.style.transition = 'transform 0.3s ease-out'
        ninaRef.current.style.transform = `translateY(${deltaY}px)`
      }

      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.3s ease'
        overlayRef.current.style.opacity = '0'
      }

      showContent()

      t(() => {
        setOverlayVisible(false)
        sessionStorage.setItem('introPlayed', 'true')
      }, 350)
    }, 5600)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [showContent, setCursorOverride])

  if (!overlayVisible) return null

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#2e3039',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Logo container: wings + ninaro share a relative container sized to ninaro */}
      <div ref={ninaContainerRef} style={{ position: 'relative', width: NINA_W }}>
        {/* Wings — absolutely centered, behind ninaro */}
        <img
          ref={wingsRef}
          src="/images/assets/components/wings-dark.png"
          alt=""
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            width: WINGS_W,
            height: 'auto',
            pointerEvents: 'none',
          }}
        />
        {/* Ninaro */}
        <div
          ref={ninaRef}
          style={{
            position: 'relative',
            zIndex: 1,
            opacity: 0,
            transform: 'scale(0.8)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        >
          <img
            src="/images/assets/ninaro.png"
            alt="NINARÒ"
            width={NINA_W}
            height={NINA_H}
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Text — 60px below ninaro bottom edge */}
      <div
        ref={textContainerRef}
        style={{
          marginTop: 60,
          position: 'relative',
          opacity: 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            fontFamily: 'var(--font-piazzolla)',
            fontWeight: 300,
            fontSize: 18,
            color: '#FBFFFF',
            letterSpacing: '0.25em',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            ref={artistRef}
            style={{
              opacity: 0,
              transform: 'translateX(-60px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            ARTIST
          </span>
          <span
            ref={colonRef}
            style={{
              opacity: 0,
              transform: 'translateY(-20px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            :
          </span>
          <span
            ref={tattooistRef}
            style={{
              opacity: 0,
              transform: 'translateX(60px)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              display: 'inline-block',
            }}
          >
            TATTOOIST
          </span>
        </div>

        {/* Top-left corner bracket */}
        <div style={{ position: 'absolute', top: -6, left: -10 }}>
          <div
            ref={tlHRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 0,
              height: 1,
              backgroundColor: '#FBFFFF',
              transition: 'width 0.3s ease',
            }}
          />
          <div
            ref={tlVRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1,
              height: 0,
              backgroundColor: '#FBFFFF',
              transition: 'height 0.3s ease',
            }}
          />
        </div>

        {/* Bottom-right corner bracket */}
        <div style={{ position: 'absolute', bottom: -6, right: -10 }}>
          <div
            ref={brHRef}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 1,
              backgroundColor: '#FBFFFF',
              transition: 'width 0.3s ease',
            }}
          />
          <div
            ref={brVRef}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 1,
              height: 0,
              backgroundColor: '#FBFFFF',
              transition: 'height 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
