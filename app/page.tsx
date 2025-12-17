import { headers } from 'next/headers'
import { MainSplitHero } from '@/components/MainSplitHero'
import { SubHome } from '@/components/SubHome'
import { SiteNav } from '@/components/SiteNav'
import { SiteVariant } from '@/lib/constants'

export default async function HomePage() {
  const headersList = await headers()
  const variant = (headersList.get('x-site-variant') as SiteVariant) || 'main'

  return (
    <>
      <SiteNav variant={variant} />
      
      {variant === 'main' ? (
        <MainSplitHero />
      ) : (
        <SubHome variant={variant as 'art' | 'tattoo'} />
      )}
    </>
  )
}
