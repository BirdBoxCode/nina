import { ArtGallery } from '@/components/ArtGallery'
import { getByCategory } from '@/lib/sanity/artworks'

export default async function InstallationsPage() {
  return <ArtGallery category="installations" pieces={await getByCategory('installations')} />
}
