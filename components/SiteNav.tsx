'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SITE_CONFIG, SiteVariant } from '@/lib/constants'

// Note: variant is passed from Server Component prop
export function SiteNav({ variant = 'main' }: { variant?: SiteVariant }) {
  const config = SITE_CONFIG[variant]
  const isMain = variant === 'main'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 transition-all duration-300',
        isMain ? 'bg-transparent text-white' : 'bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800'
      )}
    >
      <div className="text-xl font-bold tracking-tighter uppercase">
        <Link href="/">
          {isMain ? 'NINA' : config.title}
        </Link>
      </div>

      <nav className="flex gap-8">
        {config.nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm uppercase tracking-widest hover:opacity-50 transition-opacity"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
