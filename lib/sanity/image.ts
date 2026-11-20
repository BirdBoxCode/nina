import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, projectId } from './client'

const builder = createImageUrlBuilder({ projectId, dataset })

/** Optimised CDN URL for a Sanity image (respects any crop set in the Studio). */
export function imageUrl(source: SanityImageSource, width = 2000): string {
  return builder.image(source).width(width).fit('max').auto('format').url()
}

/** The editor's focal point as CSS `object-position`, so `object-cover` crops around it. */
export function hotspotPosition(hotspot?: { x: number; y: number } | null): string | undefined {
  if (!hotspot) return undefined
  return `${(hotspot.x * 100).toFixed(1)}% ${(hotspot.y * 100).toFixed(1)}%`
}
