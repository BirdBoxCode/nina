'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { TransitionLink } from '@/components/PageTransition'
import { CATEGORY_META, type Artwork } from '@/lib/artworks'

// Near-opaque veil over the global fluid canvas — lets a trace of drift through.
const SURFACE = 'rgba(251, 255, 255, 0.96)'
const INK = '#2E3352'

const CATEGORY_HREF: Record<Artwork['category'], string> = {
  murals: '/walls',
  paintings: '/paintings',
  illustrations: '/illustration',
  installations: '/installations',
}

export function ArtworkDetail({
  piece,
  prev,
  next,
}: {
  piece: Artwork
  prev: Artwork
  next: Artwork
}) {
  const backHref = CATEGORY_HREF[piece.category]

  return (
    // `relative z-10 isolate` lifts the page above the fixed z-0 fluid canvas.
    <div
      className="relative z-10 isolate flex min-h-screen w-full flex-col md:flex-row"
      style={{ backgroundColor: SURFACE }}
    >
      {/* --- LEFT: the artwork, full-bleed --- */}
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[55vh] w-full overflow-hidden md:h-screen md:w-1/2"
        style={{ backgroundColor: piece.tint }}
      >
        <Image
          src={piece.image}
          alt={piece.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className={piece.fit === 'cover' ? 'object-cover' : 'object-contain p-12'}
        />
      </motion.div>

      {/* --- RIGHT: title, series, navigation --- */}
      <div className="relative flex w-full flex-col md:h-screen md:w-1/2">
        {/* Close */}
        <div className="flex justify-end px-6 py-6 md:px-10">
          <TransitionLink
            href={backHref}
            aria-label={`Back to ${CATEGORY_META[piece.category].label}`}
            className="transition-opacity duration-300 hover:opacity-50"
            style={{ color: INK }}
          >
            <X size={22} strokeWidth={1.25} />
          </TransitionLink>
        </div>

        {/* Centred title block */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="flex flex-1 flex-col items-center justify-center px-10 py-16 text-center md:py-0"
        >
          <h1
            className="text-[22px] uppercase tracking-[0.28em] md:text-[26px]"
            style={{ color: INK }}
          >
            {piece.title}
          </h1>

          <p className="mt-4 text-[11px] uppercase tracking-[0.22em]" style={{ color: INK }}>
            <span className="opacity-45">Series:</span>{' '}
            <span className="opacity-80">{piece.series}</span>
          </p>

          <p
            className="mt-1 text-[11px] uppercase tracking-[0.22em] opacity-45"
            style={{ color: INK }}
          >
            {piece.year} — {piece.medium}
          </p>

          <p
            className="mt-8 max-w-[420px] text-[13px] leading-relaxed opacity-60"
            style={{ color: INK }}
          >
            {piece.description}
          </p>
        </motion.div>

        {/* Prev / Next */}
        <div className="flex items-center justify-between px-6 pb-8 md:px-10 md:pb-10">
          <TransitionLink
            href={`/works/${prev.slug}`}
            className="text-[11px] uppercase tracking-[0.25em] transition-opacity duration-300 hover:opacity-50"
            style={{ color: INK }}
          >
            ← Prev
          </TransitionLink>
          <TransitionLink
            href={`/works/${next.slug}`}
            className="text-[11px] uppercase tracking-[0.25em] transition-opacity duration-300 hover:opacity-50"
            style={{ color: INK }}
          >
            Next →
          </TransitionLink>
        </div>

        {/* Vertical share rail — desktop only */}
        <div
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-6 lg:flex"
          style={{ color: INK }}
        >
          <span className="text-[9px] uppercase tracking-[0.3em] opacity-30 [writing-mode:vertical-rl]">
            Share to
          </span>
          <a
            href="#"
            className="text-[9px] uppercase tracking-[0.3em] opacity-45 transition-opacity duration-300 hover:opacity-80 [writing-mode:vertical-rl]"
          >
            Instagram
          </a>
          <a
            href="#"
            className="text-[9px] uppercase tracking-[0.3em] opacity-45 transition-opacity duration-300 hover:opacity-80 [writing-mode:vertical-rl]"
          >
            Facebook
          </a>
        </div>
      </div>
    </div>
  )
}
