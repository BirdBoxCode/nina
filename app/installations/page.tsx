import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/artworks'

export default function InstallationsPage() {
  return <ArtGallery category="installations" pieces={getByCategory('installations')} />
}
