'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useIntro } from './IntroContext'

export function CustomCursor() {
  const { cursorOverride } = useIntro()

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
    </div>
  )
}
