'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'
import { CONTENT } from '@/lib/constants'

// "art" or "tattoo"
type SubVariant = 'art' | 'tattoo'

export function SubHome({ variant }: { variant: SubVariant }) {
  const content = CONTENT[variant]
  const isArt = variant === 'art'
  const bgImage = isArt ? '/art-hero.svg' : '/tattoo-hero.svg'

  return (
    <div className="relative min-h-screen bg-neutral-900 text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />

        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-6xl md:text-9xl font-bold tracking-tighter mb-6 mix-blend-overlay"
          >
            {content.heroTitle}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl font-light tracking-widest text-neutral-300 max-w-2xl mx-auto"
          >
            {content.heroSubtitle}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-12 flex flex-col md:flex-row gap-6 justify-center items-center"
          >
            <Link 
              href="#" // Placeholder
              className="px-8 py-3 border border-white/30 hover:bg-white hover:text-black transition-all uppercase tracking-widest text-sm"
            >
              View Portfolio
            </Link>
            <Link 
              href="/contact"
              className="px-8 py-3 bg-white text-black hover:bg-neutral-200 transition-all uppercase tracking-widest text-sm font-semibold"
            >
              Contact
            </Link>
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ArrowDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </section>

      {/* Basic Featured Section Placeholder */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-light mb-12 border-b border-neutral-800 pb-4">Selected Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-4/5 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-700 animate-pulse">
                [Portfolio Item {i}]
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
