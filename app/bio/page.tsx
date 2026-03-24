import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { SiteVariant, CONTENT } from '@/lib/constants'

export default async function BioPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'
  const content = CONTENT.tattoo.about

  return (
    <>
      <SiteNav variant={variant} />
      <SubPageLayout variant={variant} title="Bio">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
          <div className="md:col-span-5 space-y-12">
            <div className="aspect-[4/5] bg-neutral-900 overflow-hidden relative border border-white/10 group">
               <div 
                 className="w-full h-full bg-cover bg-center grayscale contrast-125"
                 style={{ backgroundImage: `url('${content.image}')` }}
               />
               <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-60" />
            </div>
          </div>
          
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="relative border-l border-white/10 pl-12 space-y-8">
              <div className="absolute -left-1 top-0 w-2 h-2 bg-white" />
              <h2 className="text-4xl font-bold tracking-tighter uppercase font-[family-name:var(--font-space-mono)]">Philosophy</h2>
              <p className="text-xl md:text-3xl font-light text-neutral-400 leading-snug">
                {content.bio}
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-12 text-[10px] tracking-[0.4em] uppercase opacity-40">
                <div>
                  <p className="mb-2">Practice</p>
                  <ul className="space-y-1">
                    <li>Fine Line</li>
                    <li>Blackwork</li>
                    <li>Experimental</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2">Based in</p>
                  <ul className="space-y-1">
                    <li>Berlin</li>
                    <li>London</li>
                    <li>Rome</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubPageLayout>
    </>
  )
}
