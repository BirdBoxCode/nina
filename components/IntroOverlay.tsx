'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useIntro } from './IntroContext'

// ninaro: 400×135 → displayed at 257px wide
const NINA_W = 257
const NINA_H = Math.round(NINA_W * (135 / 400)) // 87px

export function IntroOverlay() {
  const { showContent, setCursorOverride } = useIntro()
  const [overlayVisible, setOverlayVisible] = useState(true)

  const overlayRef = useRef<HTMLDivElement>(null)
  const ninaContainerRef = useRef<HTMLDivElement>(null)
  const ninaRef = useRef<HTMLDivElement>(null)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const artistRef = useRef<HTMLSpanElement>(null)
  const colonRef = useRef<HTMLSpanElement>(null)
  const tattooistRef = useRef<HTMLSpanElement>(null)
  const tlHRef = useRef<HTMLDivElement>(null)
  const tlVRef = useRef<HTMLDivElement>(null)
  const brHRef = useRef<HTMLDivElement>(null)
  const brVRef = useRef<HTMLDivElement>(null)

  const bullRef = useRef<HTMLImageElement>(null)
  const dragonRef = useRef<HTMLImageElement>(null)
  const marking2Ref = useRef<HTMLImageElement>(null)
  const markingRef = useRef<HTMLImageElement>(null)
  const shellRef = useRef<HTMLImageElement>(null)
  const swordRef = useRef<HTMLImageElement>(null)

  const whiteOverlayRef = useRef<HTMLDivElement>(null)

  const mouseRef = useRef({ x: 0, y: 0 })
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
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
      // — enter top-right, then linger and look around —
      [ 150, W * 0.85, H * 0.13],  // arrive top-right
      [ 860, W * 0.86, H * 0.16],  // slow drift (700ms — hovering)
      [1070, W * 0.88, H * 0.14],  // micro counter-move (200ms — hesitation)

      // — sudden dart to bottom-right, arrive and settle —
      [1350, W * 0.79, H * 0.75],  // fast dart (280ms — whips across)
      [1930, W * 0.76, H * 0.78],  // slow drift as it arrives (580ms)

      // — dart across to bottom-left, hover —
      [2190, W * 0.22, H * 0.72],  // fast dart (260ms)
      [2760, W * 0.18, H * 0.70],  // settle and linger (570ms)
      [2990, W * 0.20, H * 0.73],  // micro drift (230ms — looking around)

      // — dart up to top-left, brief hover —
      [3300, W * 0.15, H * 0.17],  // fast dart up (310ms)
      [3660, W * 0.16, H * 0.15],  // hover (360ms)

      // — quick dart toward top-center before settling —
      [3780, W * 0.52, H * 0.11],  // fast dart (120ms — snappy)
    ]
    cursorWaypoints.forEach(([delay, x, y]) => {
      t(() => setCursorOverride({ x, y }), delay)
    })

    // Step 3 — text sequence (900ms)
    t(() => {
      if (artistRef.current) {
        artistRef.current.style.opacity = '1'
        artistRef.current.style.transform = 'translateX(0)'
      }
    }, 900)
    t(() => {
      if (colonRef.current) {
        colonRef.current.style.opacity = '1'
        colonRef.current.style.transform = 'translateY(0)'
      }
    }, 1300)
    t(() => {
      if (tattooistRef.current) {
        tattooistRef.current.style.opacity = '1'
        tattooistRef.current.style.transform = 'translateX(0)'
      }
    }, 1700)

    // Step 3.5 — assets scatter from center (1200ms); starts with text animation, eases out to landing positions
    t(() => {
      const cap = (val: number, max: number) => Math.min(Math.abs(val), max) * Math.sign(val)
      const scatterAsset = (el: HTMLImageElement | null, dx: number, dy: number) => {
        if (!el) return
        el.style.transition = 'opacity 1.1s ease-out, transform 1.1s ease-out'
        el.style.opacity = '1'
        el.style.transform = `translate(calc(-50% + ${cap(dx, 380)}px), calc(-50% + ${cap(dy, 260)}px))`
      }
      scatterAsset(bullRef.current,     -W * 0.36,  H * 0.32)
      scatterAsset(dragonRef.current,    W * 0.36, -H * 0.32)
      scatterAsset(marking2Ref.current,  W * 0.30,  H * 0.30)
      scatterAsset(markingRef.current,  -W * 0.42, -H * 0.08)
      scatterAsset(shellRef.current,    -W * 0.30, -H * 0.30)
      scatterAsset(swordRef.current,     W * 0.42, -H * 0.01)
    }, 1200)

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

    // Step 5.5 — text splits apart + assets converge back to center (4050ms)
    t(() => {
      const gatherAsset = (el: HTMLImageElement | null) => {
        if (!el) return
        el.style.transition = 'opacity 0.18s ease-in, transform 0.18s ease-in'
        el.style.opacity = '0'
        el.style.transform = 'translate(-50%, -50%)'
      }
      gatherAsset(bullRef.current)
      gatherAsset(dragonRef.current)
      gatherAsset(marking2Ref.current)
      gatherAsset(markingRef.current)
      gatherAsset(shellRef.current)
      gatherAsset(swordRef.current)

      if (artistRef.current) {
        artistRef.current.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
        artistRef.current.style.opacity = '0'
        artistRef.current.style.transform = 'translateX(-200px)'
      }
      if (colonRef.current) {
        colonRef.current.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
        colonRef.current.style.opacity = '0'
        colonRef.current.style.transform = 'translateY(80px)'
      }
      if (tattooistRef.current) {
        tattooistRef.current.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
        tattooistRef.current.style.opacity = '0'
        tattooistRef.current.style.transform = 'translateX(200px)'
      }
    }, 4050)

    // Step 6 — white layer fades in over gradient (4400ms)
    t(() => {
      if (whiteOverlayRef.current) whiteOverlayRef.current.style.opacity = '1'
    }, 4400)

    // Step 7a — ninaro scales to match home size and center-aligns (5000ms)
    t(() => {
      const homepageNinaro = document.getElementById('homepage-ninaro')
      const introNinaro = ninaContainerRef.current

      if (homepageNinaro && introNinaro && ninaRef.current) {
        const homeRect = homepageNinaro.getBoundingClientRect()
        const introRect = introNinaro.getBoundingClientRect()
        const scale = homeRect.width / introRect.width
        const centerDeltaY = (homeRect.top + homeRect.height / 2) - (introRect.top + introRect.height / 2)
        const centerDeltaX = (homeRect.left + homeRect.width / 2) - (introRect.left + introRect.width / 2)
        ninaRef.current.style.transition = 'transform 0.3s ease-out'
        ninaRef.current.style.transform = `translate(${centerDeltaX}px, ${centerDeltaY}px) scale(${scale})`
      }
    }, 5000)

    // Step 7b — cross-fade: overlay out, home content in (5300ms)
    t(() => {
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.4s ease'
        overlayRef.current.style.opacity = '0'
      }

      showContent()

      t(() => setOverlayVisible(false), 450)
    }, 5900)

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
        background: '#2E3039',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* White layer that fades in at Step 6 to wipe over the gradient before homepage appears */}
      <div
        ref={whiteOverlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#FBFFFF',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Scattered assets — burst from center at bracket-in, converge back at text-split */}
      {[
        { ref: bullRef,     src: '/images/assets/components/bull.png',       w: 280, alt: '' },
        { ref: dragonRef,   src: '/images/assets/components/dragon.png',     w: 260, alt: '' },
        { ref: marking2Ref, src: '/images/assets/components/marking-2.png',  w: 220, alt: '' },
        { ref: markingRef,  src: '/images/assets/components/marking.png',    w: 80,  alt: '' },
        { ref: shellRef,    src: '/images/assets/components/shell.png',      w: 200, alt: '' },
        { ref: swordRef,    src: '/images/assets/components/sword.png',      w: 70,  alt: '' },
      ].map(({ ref, src, w, alt }) => (
        <img
          key={src}
          ref={ref}
          src={src}
          alt={alt}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: w,
            height: 'auto',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Logo container: wings + ninaro share a relative container sized to ninaro */}
      <div ref={ninaContainerRef} style={{ position: 'relative', width: NINA_W }}>
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

      {/* Text — 20px below ninaro bottom edge */}
      <div
        ref={textContainerRef}
        style={{
          marginTop: 20,
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
            fontFamily: 'var(--font-dancing-script)',
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
        <div style={{ position: 'absolute', top: -11, left: -15 }}>
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
        <div style={{ position: 'absolute', bottom: -11, right: -15 }}>
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
