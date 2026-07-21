import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/artworks'

export default function PaintingsPage() {
  return <ArtGallery category="paintings" pieces={getByCategory('paintings')} />
}
