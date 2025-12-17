'use client'

import { useState, useEffect } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function MainSplitHero() {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null)
  
  // Parallax mouse follow
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()
    // Center origin
    const xPct = (clientX / width - 0.5) * 20
    const yPct = (clientY / height - 0.5) * 20
    x.set(xPct)
    y.set(yPct)
  }

  // Smooth springs for image movement
  const springX = useSpring(x, { stiffness: 150, damping: 20 })
  const springY = useSpring(y, { stiffness: 150, damping: 20 })

  const navigateToSubdomain = (sub: string) => {
    const host = window.location.host
    // Strip 'www.' if present to get root domain
    const root = host.replace(/^www\./, '')
    // Navigate to subdomain
    window.location.href = `${window.location.protocol}//${sub}.${root}`
  }

  // Simple mobile check (hydration safe)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div 
      className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); setHoveredSide(null) }}
    >
      {/* LEFT PANEL - ART */}
      <motion.div
        className="relative w-full md:w-auto h-1/2 md:h-full overflow-hidden cursor-pointer group border-b md:border-b-0 md:border-r border-neutral-800"
        initial={{ x: '-100%' }}
        animate={{ 
          x: '0%',
          width: isMobile ? '100%' : (hoveredSide === 'left' ? '55%' : hoveredSide === 'right' ? '45%' : '50%'),
          height: isMobile ? '50%' : '100%'
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setHoveredSide('left')}
        onClick={() => navigateToSubdomain('art')}
      >
        <motion.div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105 group-hover:scale-110"
          style={{ 
            backgroundImage: "url('/art-hero.svg')",
            x: hoveredSide === 'left' ? springX : 0,
            y: hoveredSide === 'left' ? springY : 0,
          }}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
          <motion.h2 
            className="text-6xl md:text-8xl font-bold tracking-tighter mix-blend-overlay"
            layoutId="art-title"
          >
            ART
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hoveredSide === 'left' ? 1 : 0, y: hoveredSide === 'left' ? 0 : 20 }}
            className="mt-4 flex items-center gap-2 text-sm uppercase tracking-widest bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            Enter Studio <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* CENTER SEAM */}
      <motion.div 
        className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-white/50 z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        initial={{ height: 0 }}
        animate={{ 
          height: '100%',
          left: isMobile ? '50%' : (hoveredSide === 'left' ? '55%' : hoveredSide === 'right' ? '45%' : '50%')
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* RIGHT PANEL - TATTOO */}
      <motion.div
        className="relative w-full md:w-auto h-1/2 md:h-full overflow-hidden cursor-pointer group"
        initial={{ x: isMobile ? '0%' : '100%', y: isMobile ? '100%' : '0%' }}
        animate={{ 
          x: '0%', 
          y: '0%',
          width: isMobile ? '100%' : (hoveredSide === 'right' ? '55%' : hoveredSide === 'left' ? '45%' : '50%'),
          height: isMobile ? '50%' : '100%'
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setHoveredSide('right')}
        onClick={() => navigateToSubdomain('tattoo')}
      >
        <motion.div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105 group-hover:scale-110"
          style={{ 
            backgroundImage: "url('/tattoo-hero.svg')",
            x: hoveredSide === 'right' ? springX : 0,
            y: hoveredSide === 'right' ? springY : 0,
          }}
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
          <motion.h2 
            className="text-6xl md:text-8xl font-bold tracking-tighter mix-blend-overlay"
            layoutId="tattoo-title"
          >
            TATTOO
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hoveredSide === 'right' ? 1 : 0, y: hoveredSide === 'right' ? 0 : 20 }}
            className="mt-4 flex items-center gap-2 text-sm uppercase tracking-widest bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            Enter Ink <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
