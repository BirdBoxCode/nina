'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_CONFIG, SiteVariant } from '@/lib/constants'

export function SiteNav({ variant = 'main' }: { variant?: SiteVariant }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const config = SITE_CONFIG[variant]
  const isMain = variant === 'main'
  const isArt = variant === 'art'
  const isTattoo = variant === 'tattoo'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 py-6 transition-all duration-300',
          isMain ? 'bg-transparent text-white' : 
          isArt ? 'bg-white/80 backdrop-blur-md text-black border-b border-black/5' :
          'bg-black/80 backdrop-blur-md text-white border-b border-white/5'
        )}
      >
        <div className={cn(
          "text-xl font-bold tracking-tighter uppercase",
          isArt ? "font-[family-name:var(--font-cinzel)]" : 
          isTattoo ? "font-[family-name:var(--font-space-mono)]" : ""
        )}>
          <Link href="/?v=main">
            {isMain ? 'NINA' : config.title}
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-8">
          {config.nav.map((item) => (
            <span
              key={item.href}
              className="text-sm uppercase tracking-[0.3em]"
            >
              {item.label}
            </span>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 -mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed inset-0 z-50 flex flex-col p-6 pt-24 lg:hidden",
              isArt ? "bg-white text-black" : "bg-neutral-900 text-white"
            )}
          >
            <nav className="flex flex-col gap-6">
              {config.nav.map((item) => (
                <span
                  key={item.href}
                  className={cn(
                    "text-3xl font-bold tracking-tighter uppercase border-b border-current/10 pb-4",
                    isArt ? "font-[family-name:var(--font-cinzel)]" : "font-[family-name:var(--font-space-mono)]"
                  )}
                >
                  {item.label}
                </span>
              ))}
            </nav>
            
            <div className="mt-auto flex gap-6 text-[10px] tracking-widest uppercase opacity-40">
              <a href="#">Instagram</a>
              <a href="#">Email</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
