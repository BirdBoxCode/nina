import { headers } from 'next/headers'
import { MainSplitHero } from '@/components/MainSplitHero'
import { NinaroHome } from '@/components/NinaroHome'
import { SubHome } from '@/components/SubHome'
import { SiteVariant } from '@/lib/constants'

export default async function HomePage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  // NINARÒ home (paper ground, scattered menu) is the front page for both 'main' and 'art'
  if (variant === 'main' || variant === 'art') {
    return <NinaroHome />
  }

  return <SubHome variant={variant as 'tattoo'} />
}
