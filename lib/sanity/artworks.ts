import { cache } from 'react'
import { ARTWORKS, type ArtCategory, type Artwork } from '@/lib/artworks'
import { fetchSanityArtworks } from './queries'

/**
 * Server-only artwork data. Per category: Sanity pieces once any are published,
 * otherwise the placeholder ARTWORKS — so a gallery is never empty and every
 * gallery, detail and prev/next link comes from the same list.
 */
export const getAllArtworks = cache(async (): Promise<Artwork[]> => {
  const sanity = (await fetchSanityArtworks()) ?? []
  const fromSanity = new Set(sanity.map((a) => a.category))
  return [...sanity, ...ARTWORKS.filter((a) => !fromSanity.has(a.category))]
})

export async function getByCategory(category: ArtCategory): Promise<Artwork[]> {
  return (await getAllArtworks()).filter((a) => a.category === category)
}

export async function getBySlug(slug: string): Promise<Artwork | undefined> {
  return (await getAllArtworks()).find((a) => a.slug === slug)
}

/** Prev/next wrap around within the piece's own category. */
export async function getNeighbours(slug: string): Promise<{ prev: Artwork; next: Artwork } | null> {
  const piece = await getBySlug(slug)
  if (!piece) return null
  const siblings = await getByCategory(piece.category)
  const i = siblings.findIndex((a) => a.slug === slug)
  const len = siblings.length
  return {
    prev: siblings[(i - 1 + len) % len],
    next: siblings[(i + 1) % len],
  }
}
