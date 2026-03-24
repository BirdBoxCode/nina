import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { ContactForm } from '@/components/ContactForm'
import { SiteVariant, CONTENT } from '@/lib/constants'

export default async function BioContactPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'
  const content = CONTENT.art.about

  return (
    <>
      <SiteNav variant={variant} />
      <SubPageLayout variant={variant} title="Bio/Contact">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div className="aspect-[4/5] bg-neutral-100 overflow-hidden grayscale">
               <div 
                 className="w-full h-full bg-cover bg-center"
                 style={{ backgroundImage: `url('${content.image}')` }}
               />
            </div>
            <div className="prose prose-neutral">
              <p className="text-xl md:text-2xl font-light leading-relaxed">
                {content.bio}
              </p>
            </div>
          </div>
          
          <div className="sticky top-32 h-fit">
            <h2 className="text-3xl font-bold tracking-tighter uppercase mb-12 border-b border-black pb-4">Inquiries</h2>
            <ContactForm />
            
            <div className="mt-16 pt-8 border-t border-black/5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] tracking-[0.5em] uppercase opacity-40">
                <span>Instagram</span>
                <a href="#" className="hover:opacity-100 transition-opacity">@ninarostudio</a>
              </div>
              <div className="flex justify-between items-center text-[10px] tracking-[0.5em] uppercase opacity-40">
                <span>Email</span>
                <a href="#" className="hover:opacity-100 transition-opacity">studio@ninaro.com</a>
              </div>
            </div>
          </div>
        </div>
      </SubPageLayout>
    </>
  )
}
