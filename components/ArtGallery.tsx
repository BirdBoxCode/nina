'use client'

import { useState } from 'react'
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
import { ARTWORK_NAV } from '@/lib/constants'
import { CATEGORY_META, type ArtCategory, type Artwork } from '@/lib/artworks'

// Near-opaque veil over the global fluid canvas — lets a trace of drift through.
const SURFACE = 'rgba(251, 255, 255, 0.96)'
const HEADER_SURFACE = 'rgba(251, 255, 255, 0.92)'
const INK = '#2E3352'

// Peak diagonal, in degrees. Shared by the load-in and the scroll response so
// both lean the same way — scrolling down maps to a negative skew, so entry does too.
const SKEW_MAX = 4

function GalleryTile({
  piece,
  index,
  skew,
  baseDelay,
}: {
  piece: Artwork
  index: number
  skew: MotionValue<number>
  baseDelay: number
}) {
  return (
    <motion.div
      // Flies up from below carrying the same diagonal a downward scroll produces,
      // then settles flat — so entry and scroll read as one gesture.
      initial={{ opacity: 0, y: 110, skewY: -SKEW_MAX }}
      whileInView={{ opacity: 1, y: 0, skewY: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.95,
        ease: [0.16, 1, 0.3, 1],
        delay: baseDelay + (index % 3) * 0.09,
      }}
    >
      {/* Scroll-velocity skew — independent of the entry animation above */}
      <motion.div style={{ skewY: skew }}>
        <TransitionLink href={`/works/${piece.slug}`} className="group block">
          <div
            className="relative aspect-square w-full overflow-hidden"
            style={{ backgroundColor: piece.tint }}
          >
            <Image
              src={piece.image}
              alt={piece.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className={
                piece.fit === 'cover'
                  ? 'object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
                  : 'object-contain p-10 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]'
              }
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <h3
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: INK }}
            >
              {piece.title}
            </h3>
            <span
              className="text-[10px] uppercase tracking-[0.22em] opacity-45"
              style={{ color: INK }}
            >
              {piece.year}
            </span>
          </div>
        </TransitionLink>
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

  // One scroll listener for the whole grid; every tile shares the value.
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

  return (
    // `relative z-10 isolate` lifts the page above the fixed z-0 fluid canvas.
    <div
      className="relative z-10 isolate min-h-screen w-full"
      style={{ backgroundColor: SURFACE }}
    >
      {/* Top bar — wordmark left, nav right */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-sm" style={{ backgroundColor: HEADER_SURFACE }}>
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 md:px-10">
          <TransitionLink
            href="/"
            className="text-[13px] uppercase tracking-[0.3em]"
            style={{ color: INK }}
          >
            Ninarò
          </TransitionLink>

          <nav className="flex gap-5 md:gap-9">
            {ARTWORK_NAV.map((item) => {
              const active = item.category === category
              return (
                <TransitionLink
                  key={item.href}
                  href={item.href}
                  className="group relative text-[10px] uppercase tracking-[0.25em] md:text-[11px]"
                  style={{ color: INK, opacity: active ? 1 : 0.5 }}
                >
                  {item.label}
                  <span
                    className="pointer-events-none absolute -bottom-1.5 left-0 h-px bg-current transition-all duration-500 ease-out group-hover:w-full"
                    style={{ width: active ? '100%' : 0 }}
                  />
                </TransitionLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 pb-32 pt-10 md:px-10 md:pt-16">
        <div className="mb-12 flex items-baseline gap-4 md:mb-20">
          <h1
            className="font-[family-name:var(--font-dancing-script)] text-[44px] leading-none md:text-[64px]"
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

        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-x-10 md:gap-y-16 lg:grid-cols-3">
          {pieces.map((piece, i) => (
            <GalleryTile
              key={piece.slug}
              piece={piece}
              index={i}
              skew={skew}
              baseDelay={baseDelay}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
