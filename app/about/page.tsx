import { headers } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { PageContainer } from '@/components/PageContainer'
import { SiteVariant, CONTENT } from '@/lib/constants'

export default async function AboutPage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'
  
  // If we are on main, maybe show a generic about or redirect? 
  // User asked for "same pages: /about, /contact" for all.
  // We'll show a generic one for main if needed, or just pick one?
  // User said "About: two-column layout (photo + bio) with variant-specific copy based on site (main/art/tattoo)."
  // For main, we might need a Main Content unless user specified. 
  // Re-reading: "Left = Art, Right = Tattoo". Main domain has about/contact. "works on all variants".
  // I will create a default Main content literal here if missing.

  const content = variant === 'main' 
    ? {
        title: 'The Artist',
        bio: 'I am a multidisciplinary artist bridging the gap between canvas and skin. My work explores identity, memory, and the physical manifestation of abstract concepts.',
        image: '/art-hero.svg' // Placeholder
      }
    : CONTENT[variant].about

  return (
    <>
      <SiteNav variant={variant} />
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[60vh]">
          {/* Image Side */}
          <div className="relative aspect-4/5 md:aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
             {/* Using standard img for svg, or Next Image. Next Image requires config for external, but these are local. */}
             <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${content.image}')` }}
             />
          </div>

          {/* Text Side */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">{content.title}</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
              {content.bio}
            </p>
            
            <div className="pt-6">
               <div className="h-px w-24 bg-black dark:bg-white/30" />
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
