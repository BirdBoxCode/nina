import { notFound } from 'next/navigation'
import { ArtworkDetail } from '@/components/ArtworkDetail'
import { ARTWORKS, getBySlug, getNeighbours } from '@/lib/artworks'

export function generateStaticParams() {
  return ARTWORKS.map((a) => ({ slug: a.slug }))
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const piece = getBySlug(slug)
  const neighbours = getNeighbours(slug)

  if (!piece || !neighbours) notFound()

  return <ArtworkDetail piece={piece} prev={neighbours.prev} next={neighbours.next} />
}
