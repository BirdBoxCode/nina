import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/sanity/artworks'

export default async function MuralsPage() {
  return <ArtGallery category="murals" pieces={await getByCategory('murals')} />
}
