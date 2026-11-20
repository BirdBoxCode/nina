import { notFound } from 'next/navigation'
import { ArtworkDetail } from '@/components/ArtworkDetail'
import { getAllArtworks, getBySlug, getNeighbours } from '@/lib/sanity/artworks'

export async function generateStaticParams() {
  return (await getAllArtworks()).map((a) => ({ slug: a.slug }))
}

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const piece = await getBySlug(slug)
  const neighbours = await getNeighbours(slug)

  if (!piece || !neighbours) notFound()

  return <ArtworkDetail piece={piece} prev={neighbours.prev} next={neighbours.next} />
}
