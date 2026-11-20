import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/sanity/artworks'

export default async function PaintingsPage() {
  return <ArtGallery category="paintings" pieces={await getByCategory('paintings')} />
}
