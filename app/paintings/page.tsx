import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { SiteVariant } from '@/lib/constants'

export default async function PortfolioPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  return (
    <>
      <SiteNav variant={variant} />
      <SubPageLayout variant={variant} title="Works" subtitle="Archive">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[4/5] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative border border-current/5">
                <div className="absolute inset-0 bg-current/0 group-hover:bg-current/10 transition-colors duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-95 group-hover:scale-100">
                  <span className="text-[10px] tracking-[0.5em] uppercase px-4 py-2 border border-current backdrop-blur-sm">View Details</span>
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center text-center">
                <h3 className="text-sm font-bold tracking-[0.2em] uppercase">Piece Name {i}</h3>
                <p className="text-[10px] opacity-40 uppercase tracking-widest mt-2">2024 — Mixed Media</p>
              </div>
            </div>
          ))}
        </div>
      </SubPageLayout>
    </>
  )
}
