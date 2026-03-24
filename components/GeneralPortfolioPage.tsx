import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { SiteVariant } from '@/lib/constants'

interface GeneralPortfolioPageProps {
  title: string
  subtitle: string
}

export default async function GeneralPortfolioPage({ params }: { params: Promise<{ title: string, subtitle: string }> }) {
  // This is a template for the remaining pages
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'
  
  // In a real scenario we'd use dynamic routes, but for this specific set of 
  // static-ish pages requested, I'll provide a reusable template.
  return null 
}

export function createPortfolioPage(title: string, subtitle: string) {
  return async function Page() {
    const headersList = await headers()
    const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

    return (
      <>
        <SiteNav variant={variant} />
        <SubPageLayout variant={variant} title={title} subtitle={subtitle}>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group overflow-hidden">
                <div className="aspect-square bg-neutral-100 dark:bg-neutral-900 border border-current/5 transition-transform duration-700 group-hover:scale-105" />
                <div className="mt-4">
                   <h3 className="text-xs tracking-[0.3em] uppercase opacity-60">Project Reference {i}</h3>
                </div>
              </div>
            ))}
          </div>
        </SubPageLayout>
      </>
    )
  }
}
