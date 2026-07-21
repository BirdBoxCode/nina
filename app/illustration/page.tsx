import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/artworks'

export default function IllustrationsPage() {
  return <ArtGallery category="illustrations" pieces={getByCategory('illustrations')} />
}
