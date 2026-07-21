import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/artworks'

export default function MuralsPage() {
  return <ArtGallery category="murals" pieces={getByCategory('murals')} />
}
