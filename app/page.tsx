import { headers } from 'next/headers'
import { MainSplitHero } from '@/components/MainSplitHero'
import { DreamyLanding } from '@/components/DreamyLanding'
import { SubHome } from '@/components/SubHome'
import { SiteNav } from '@/components/SiteNav'
import { SiteVariant } from '@/lib/constants'

export default async function HomePage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  // NINARÒ Dreamy Landing is now the primary front page for both 'main' and 'art'
  if (variant === 'main' || variant === 'art') {
    return <DreamyLanding />
  }

  return (
    <>
      <SiteNav variant={variant} />
      <SubHome variant={variant as 'tattoo'} />
    </>
  )
}
