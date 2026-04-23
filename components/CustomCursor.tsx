'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const requestRef = useRef<number>(null)
  const lastTimeRef = useRef<number>(0)
  const mouseRef = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (!isHovering) setIsHovering(true)
    }

    const handleMouseLeave = () => setIsHovering(false)
    const handleMouseEnter = () => setIsHovering(true)

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isHovering])

  // Particle System Logic
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const deltaTime = time - lastTimeRef.current

        // Spawn new particles occasionally
        if (Math.random() > 0.7 && isHovering) {
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 0.1 + 0.05
          const newParticle: Particle = {
            id: Date.now() + Math.random(),
            x: mouseRef.current.x,
            y: mouseRef.current.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
          }
          setParticles((prev) => [...prev.slice(-20), newParticle])
        }

        // Update existing particles
        setParticles((prev) =>
          prev
            .map((p) => ({
              ...p,
              x: p.x + p.vx * deltaTime,
              y: p.y + p.vy * deltaTime,
              life: p.life - 0.002 * deltaTime,
            }))
            .filter((p) => p.life > 0)
        )
      }
      lastTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isHovering])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: mousePos.x - 16, // Center the 32px cursor
              y: mousePos.y - 16
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5, opacity: { duration: 0.2 } }}
          >
            <div className="relative w-8 h-8">
              <Image 
                src="/images/assets/cursor.png" 
                alt="cursor" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle "Spitting" Effect */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60"
          style={{
            left: p.x,
            top: p.y,
            opacity: p.life * 0.6,
            transform: `scale(${p.life})`,
          }}
        />
      ))}
    </div>
  )
}
