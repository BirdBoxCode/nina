import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { SiteVariant } from '@/lib/constants'

export default async function ShopPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  return (
    <>
      <SiteNav variant={variant} />
      <SubPageLayout 
        variant={variant} 
        title="Shop" 
        subtitle={variant === 'art' ? 'Available Works' : 'Flash & Merch'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="group cursor-pointer">
              <div className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative border border-current/5">
                <div className="absolute inset-0 bg-current/0 group-hover:bg-current/5 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-[10px] tracking-[0.5em] uppercase">Coming Soon</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold tracking-tight uppercase">Product {i}</h3>
                  <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Limited Edition</p>
                </div>
                <span className="text-sm font-mono opacity-60">€ —,—</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 py-12 border-t border-current/10 text-center">
          <p className="text-sm tracking-[0.3em] uppercase opacity-40">New collection dropping soon</p>
        </div>
      </SubPageLayout>
    </>
  )
}
