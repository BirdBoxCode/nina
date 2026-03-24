import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { SubPageLayout } from '@/components/SubPageLayout'
import { ContactForm } from '@/components/ContactForm'
import { SiteVariant } from '@/lib/constants'

export default async function BookingPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  return (
    <>
      <SiteNav variant={variant} />
      <SubPageLayout variant={variant} title="Booking" subtitle="Waiting List">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-12">
            <div className="p-8 border border-white/10 bg-white/5 space-y-6">
              <h2 className="text-2xl font-bold tracking-tighter uppercase font-[family-name:var(--font-space-mono)]">Process</h2>
              <ul className="space-y-4 text-sm tracking-widest uppercase opacity-60 list-decimal list-inside">
                <li>Submit the inquiry form with your idea</li>
                <li>Wait for a response (usually 1-2 weeks)</li>
                <li>Consultation via Email or in person</li>
                <li>Deposit and Appointment booking</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tighter uppercase font-[family-name:var(--font-space-mono)]">Status</h2>
              <div className="flex items-center gap-4">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm tracking-[0.3em] uppercase">Books Closed — Waitlist Open</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-12">
             <div className="relative">
               <div className="absolute -left-6 top-0 w-px h-full bg-white/10" />
               <ContactForm />
             </div>
          </div>
        </div>
      </SubPageLayout>
    </>
  )
}
