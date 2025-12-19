'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function MainSplitHero() {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null)
  
  // Mouse position for parallax
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Smoothed mouse values
  const springX = useSpring(x, { stiffness: 100, damping: 30 })
  const springY = useSpring(y, { stiffness: 100, damping: 30 })

  // Inverse movement for text (depth effect)
  const textX = useTransform(springX, (val) => val * -1.5)
  const textY = useTransform(springY, (val) => val * -1.5)

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()
    // Normalized coordinates -0.5 to 0.5
    const xPct = (clientX / width - 0.5) * 50 // Scale for pixel movement
    const yPct = (clientY / height - 0.5) * 50
    x.set(xPct)
    y.set(yPct)
  }

  const navigateToSubdomain = (sub: string) => {
    // In a real multi-domain setup, we'd redirect. 
    // For this prototype/single-app, we might just be showing different content
    // But observing the user's codebase, it seems they want sub-sites.
    // We will stick to the existing logic.
    const host = window.location.host
    const root = host.replace(/^www\./, '')
    // navigate to subdomain
     window.location.href = `${window.location.protocol}//${sub}.${root}`
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div 
      className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); setHoveredSide(null) }}
    >
      {/* --- LEFT SIDE: ART (Ninarò) --- */}
      <motion.div
        className="relative overflow-hidden cursor-pointer group z-10"
        initial={{ x: '-100%' }}
        animate={{ 
          x: '0%',
          width: isMobile ? '100%' : (hoveredSide === 'left' ? '55%' : hoveredSide === 'right' ? '45%' : '50%'),
          height: isMobile ? '50%' : '100%',
          filter: hoveredSide === 'right' ? 'grayscale(80%) blur(2px)' : 'grayscale(0%) blur(0px)',
          opacity: hoveredSide === 'right' ? 0.6 : 1
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setHoveredSide('left')}
        onClick={() => navigateToSubdomain('art')}
      >
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-105 group-hover:scale-110"
          style={{ 
            backgroundImage: "url('/images/hero-art.jpg')",
            x: springX,
            y: springY,
          }}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none p-6 text-center">
          <motion.div style={{ x: textX, y: textY }}>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-cinzel)] font-bold tracking-widest drop-shadow-lg">
              NINARÒ
            </h2>
            <p className="mt-2 text-sm md:text-base tracking-[0.3em] font-light opacity-80 font-[family-name:var(--font-inter)]">
              FINE ART
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: hoveredSide === 'left' ? 1 : 0, 
              scale: hoveredSide === 'left' ? 1 : 0.9,
              y: hoveredSide === 'left' ? 0 : 20 
            }}
            transition={{ duration: 0.4 }}
            className="mt-8 flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-widest uppercase hover:bg-white/20 transitionless"
          >
            <span>Enter Gallery</span> 
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* --- CENTER SEAM (The "Breathing" Membrane) --- */}
      <motion.div 
        className="absolute z-30 pointer-events-none hidden md:block"
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: '100%', 
          opacity: 1,
          left: isMobile ? '50%' : (hoveredSide === 'left' ? '55%' : hoveredSide === 'right' ? '45%' : '50%')
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ top: 0, width: '2px', marginLeft: '-1px' }} // Centered exactly
      >
        <div className="h-full w-full bg-white/50 shadow-[0_0_15px_rgba(255,255,255,0.6)] relative overflow-hidden">
           {/* Animated flow effect within the line */}
           <motion.div 
             className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent" 
             animate={{ y: ['-100%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
           />
        </div>
      </motion.div>


      {/* --- RIGHT SIDE: TATTOO (Lineacruda) --- */}
      <motion.div
        className="relative overflow-hidden cursor-pointer group z-10"
        initial={{ x: isMobile ? '0%' : '100%', y: isMobile ? '100%' : '0%' }}
        animate={{ 
          x: '0%',
          y: '0%',
          width: isMobile ? '100%' : (hoveredSide === 'right' ? '55%' : hoveredSide === 'left' ? '45%' : '50%'),
          height: isMobile ? '50%' : '100%',
          filter: hoveredSide === 'left' ? 'grayscale(100%) blur(2px)' : 'grayscale(0%) blur(0px)',
          opacity: hoveredSide === 'left' ? 0.6 : 1
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setHoveredSide('right')}
        onClick={() => navigateToSubdomain('tattoo')}
      >
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out scale-105 group-hover:scale-110"
          style={{ 
            backgroundImage: "url('/images/hero-tattoo.jpg')",
            x: springX,
            y: springY,
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none p-6 text-center">
          <motion.div style={{ x: textX, y: textY }}>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-space-mono)] font-bold tracking-tighter mix-blend-screen">
              LINEACRUDA
            </h2>
            <p className="mt-2 text-sm md:text-base tracking-[0.2em] font-light opacity-80 font-[family-name:var(--font-inter)] uppercase">
              Tattoo Practice
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: hoveredSide === 'right' ? 1 : 0, 
              scale: hoveredSide === 'right' ? 1 : 0.9,
              y: hoveredSide === 'right' ? 0 : 20 
            }}
            transition={{ duration: 0.4 }}
            className="mt-8 flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium tracking-widest uppercase hover:bg-white/20 transitionless"
          >
            <span>Enter Studio</span> 
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
