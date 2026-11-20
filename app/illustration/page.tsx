import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/sanity/artworks'

export default async function IllustrationsPage() {
  return <ArtGallery category="illustrations" pieces={await getByCategory('illustrations')} />
}
