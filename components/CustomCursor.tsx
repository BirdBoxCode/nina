'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useIntro } from './IntroContext'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
}

export function CustomCursor() {
  const { contentVisible, cursorOverride } = useIntro()
  const [isHovering, setIsHovering] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const requestRef = useRef<number>(null)
  const lastTimeRef = useRef<number>(0)
  const mouseRef = useRef({ x: -100, y: -100 })
  const cursorOverrideRef = useRef(cursorOverride)
  const prevSpawnPosRef = useRef({ x: -100, y: -100 })

  useEffect(() => {
    cursorOverrideRef.current = cursorOverride
  }, [cursorOverride])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

        // Spawn new particles only while cursor is moving
        const spawnPos = cursorOverrideRef.current ?? (isHovering ? mouseRef.current : null)
        const hasMoved = spawnPos && (spawnPos.x !== prevSpawnPosRef.current.x || spawnPos.y !== prevSpawnPosRef.current.y)
        if (Math.random() > 0.7 && hasMoved) {
          prevSpawnPosRef.current = { x: spawnPos.x, y: spawnPos.y }
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 0.1 + 0.05
          const newParticle: Particle = {
            id: Date.now() + Math.random(),
            x: spawnPos.x,
            y: spawnPos.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            hue: (Date.now() / 15) % 360,
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
    <div className="fixed inset-0 pointer-events-none z-[10000]">
      <AnimatePresence>
        {cursorOverride !== null && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: cursorOverride.x - 16,
              y: cursorOverride.y - 16
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

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: p.x,
            top: p.y,
            opacity: p.life * 0.8,
            transform: `scale(${p.life})`,
            backgroundColor: `hsl(${p.hue}, 90%, 70%)`,
            boxShadow: `0 0 ${6 * p.life}px hsl(${p.hue}, 90%, 70%)`,
          }}
        />
      ))}
    </div>
  )
}
