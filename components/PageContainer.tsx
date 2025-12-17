import { cn } from '@/lib/utils'

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <main className={cn('min-h-screen pt-24 px-6 max-w-7xl mx-auto', className)}>
      {children}
    </main>
  )
}
