import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { PageContainer } from '@/components/PageContainer'
import { ContactForm } from '@/components/ContactForm'
import { SiteVariant } from '@/lib/constants'

export default async function ContactPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  return (
    <>
      <SiteNav variant={variant} />
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Get in Touch</h1>
            <p className="text-neutral-500">
              For {variant === 'tattoo' ? 'booking inquiries and consultations' : variant === 'art' ? 'commissions and exhibitions' : 'inquiries'}.
            </p>
          </div>
          
          <ContactForm />
          
          <div className="mt-16 flex justify-center gap-8 text-sm uppercase tracking-widest text-neutral-400">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Email</a>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
