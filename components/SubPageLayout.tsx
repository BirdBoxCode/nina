'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SiteVariant } from '@/lib/constants'

interface SubPageLayoutProps {
  variant: SiteVariant
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function SubPageLayout({ variant, title, subtitle, children }: SubPageLayoutProps) {
  const isArt = variant === 'art'
  const isTattoo = variant === 'tattoo'

  return (
    <div className={cn(
      'min-h-screen pt-24 pb-20 px-6',
      isArt ? 'bg-white text-black' : 'bg-black text-white'
    )}>
      {/* Decorative Branding */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-current opacity-10" />
      
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-end gap-4 border-b border-current pb-4"
          >
            <h1 className={cn(
              'text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-none',
              isArt ? 'font-[family-name:var(--font-cinzel)]' : 'font-[family-name:var(--font-space-mono)]'
            )}>
              {title}
            </h1>
            {subtitle && (
              <span className="text-sm md:text-base tracking-[0.3em] opacity-40 uppercase mb-2 md:mb-4 shrink-0">
                / {subtitle}
              </span>
            )}
          </motion.div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Stylish Vertical Label for Desktop */}
      <div className={cn(
        "hidden lg:flex fixed left-4 top-1/2 -rotate-90 origin-left items-center gap-4 text-[10px] tracking-[0.5em] uppercase opacity-30 select-none",
        isArt ? "text-black" : "text-white"
      )}>
        <span className="w-12 h-px bg-current" />
        {isArt ? "Ninarò Studio" : "Lineacruda Practice"}
        <span className="w-12 h-px bg-current" />
      </div>
    </div>
  )
}
