export type ArtCategory = 'murals' | 'paintings' | 'illustrations' | 'installations'

export interface Artwork {
  slug: string
  title: string
  series: string
  year: string
  medium: string
  category: ArtCategory
  /** Placeholder asset. Paths confirmed against /public. */
  image: string
  /** Line-art PNGs sit inside a tinted block; photographs fill the frame. */
  fit: 'cover' | 'contain'
  /** Backing colour behind the image — the only visible surface for `contain` pieces. */
  tint: string
  description: string
}

export const CATEGORY_META: Record<ArtCategory, { label: string; subtitle: string }> = {
  murals: { label: 'Murals', subtitle: 'Walls & Facades' },
  paintings: { label: 'Paintings', subtitle: 'Studio Works' },
  illustrations: { label: 'Illustrations', subtitle: 'Line & Ink' },
  installations: { label: 'Installations', subtitle: 'Spatial' },
}

const PHOTO_A = '/images/hero-art.jpg'
const PHOTO_B = '/images/hero-tattoo.jpg'
const PHOTO_C = '/placeholder-art-about.jpg'
const PHOTO_D = '/placeholder-tattoo-about.jpg'
const LINE = (name: string) => `/images/assets/components/${name}.png`

const PLACEHOLDER_BODY =
  'Placeholder copy. This piece is part of an ongoing body of work exploring texture, ' +
  'line and the space between figure and ground. Final description to follow.'

export const ARTWORKS: Artwork[] = [
  // --- Murals ---
  { slug: 'bull-facade', title: 'Bull Facade', series: 'Street Cycle', year: '2024', medium: 'Spray & emulsion', category: 'murals', image: LINE('bull'), fit: 'contain', tint: '#D9DCEF', description: PLACEHOLDER_BODY },
  { slug: 'north-wall', title: 'North Wall', series: 'Street Cycle', year: '2024', medium: 'Spray & emulsion', category: 'murals', image: PHOTO_A, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'dragon-run', title: 'Dragon Run', series: 'Street Cycle', year: '2023', medium: 'Spray & emulsion', category: 'murals', image: LINE('dragon'), fit: 'contain', tint: '#E4DCD4', description: PLACEHOLDER_BODY },
  { slug: 'quiet-corner', title: 'Quiet Corner', series: 'Happening', year: '2023', medium: 'Spray & emulsion', category: 'murals', image: PHOTO_C, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'marking-one', title: 'Marking I', series: 'Happening', year: '2023', medium: 'Spray & emulsion', category: 'murals', image: LINE('marking'), fit: 'contain', tint: '#CFD6E8', description: PLACEHOLDER_BODY },
  { slug: 'south-gable', title: 'South Gable', series: 'Street Cycle', year: '2022', medium: 'Spray & emulsion', category: 'murals', image: PHOTO_B, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },

  // --- Paintings ---
  { slug: 'goose-on-fire', title: 'Goose On Fire', series: 'Happening', year: '2024', medium: 'Oil on linen', category: 'paintings', image: PHOTO_A, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'shell-study', title: 'Shell Study', series: 'Still', year: '2024', medium: 'Oil on linen', category: 'paintings', image: LINE('shell'), fit: 'contain', tint: '#EDE6DC', description: PLACEHOLDER_BODY },
  { slug: 'dark-wings', title: 'Dark Wings', series: 'Happening', year: '2023', medium: 'Acrylic on board', category: 'paintings', image: LINE('wings-dark'), fit: 'contain', tint: '#D2D6E6', description: PLACEHOLDER_BODY },
  { slug: 'red-hour', title: 'Red Hour', series: 'Still', year: '2023', medium: 'Oil on linen', category: 'paintings', image: PHOTO_D, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'sword-and-thread', title: 'Sword & Thread', series: 'Happening', year: '2022', medium: 'Acrylic on board', category: 'paintings', image: LINE('sword'), fit: 'contain', tint: '#E2DDE9', description: PLACEHOLDER_BODY },
  { slug: 'low-light', title: 'Low Light', series: 'Still', year: '2022', medium: 'Oil on linen', category: 'paintings', image: PHOTO_C, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },

  // --- Illustrations ---
  { slug: 'marking-two', title: 'Marking II', series: 'Ink Notes', year: '2024', medium: 'Ink on paper', category: 'illustrations', image: LINE('marking-2'), fit: 'contain', tint: '#E8E4DC', description: PLACEHOLDER_BODY },
  { slug: 'folded-crane', title: 'Folded Crane', series: 'Ink Notes', year: '2024', medium: 'Ink on paper', category: 'illustrations', image: PHOTO_B, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'bull-sketch', title: 'Bull Sketch', series: 'Ink Notes', year: '2023', medium: 'Ink on paper', category: 'illustrations', image: LINE('bull'), fit: 'contain', tint: '#DCE0F0', description: PLACEHOLDER_BODY },
  { slug: 'second-skin', title: 'Second Skin', series: 'Bodywork', year: '2023', medium: 'Digital', category: 'illustrations', image: PHOTO_D, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'shell-outline', title: 'Shell Outline', series: 'Ink Notes', year: '2022', medium: 'Ink on paper', category: 'illustrations', image: LINE('shell'), fit: 'contain', tint: '#E6E9F2', description: PLACEHOLDER_BODY },
  { slug: 'long-line', title: 'Long Line', series: 'Bodywork', year: '2022', medium: 'Digital', category: 'illustrations', image: PHOTO_A, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },

  // --- Installations ---
  { slug: 'hanging-wings', title: 'Hanging Wings', series: 'Spatial', year: '2024', medium: 'Mixed media', category: 'installations', image: LINE('wings-dark'), fit: 'contain', tint: '#D6DAEA', description: PLACEHOLDER_BODY },
  { slug: 'room-of-salt', title: 'Room Of Salt', series: 'Spatial', year: '2024', medium: 'Mixed media', category: 'installations', image: PHOTO_C, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'dragon-suspended', title: 'Dragon Suspended', series: 'Spatial', year: '2023', medium: 'Mixed media', category: 'installations', image: LINE('dragon'), fit: 'contain', tint: '#E9E2DA', description: PLACEHOLDER_BODY },
  { slug: 'the-long-table', title: 'The Long Table', series: 'Happening', year: '2023', medium: 'Mixed media', category: 'installations', image: PHOTO_B, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
  { slug: 'sword-line', title: 'Sword Line', series: 'Spatial', year: '2022', medium: 'Mixed media', category: 'installations', image: LINE('sword'), fit: 'contain', tint: '#DDD9E7', description: PLACEHOLDER_BODY },
  { slug: 'after-image', title: 'After Image', series: 'Happening', year: '2022', medium: 'Mixed media', category: 'installations', image: PHOTO_D, fit: 'cover', tint: '#2E3352', description: PLACEHOLDER_BODY },
]

export function getByCategory(category: ArtCategory): Artwork[] {
  return ARTWORKS.filter((a) => a.category === category)
}

export function getBySlug(slug: string): Artwork | undefined {
  return ARTWORKS.find((a) => a.slug === slug)
}

/** Prev/next wrap around within the piece's own category. */
export function getNeighbours(slug: string): { prev: Artwork; next: Artwork } | null {
  const piece = getBySlug(slug)
  if (!piece) return null
  const siblings = getByCategory(piece.category)
  const i = siblings.findIndex((a) => a.slug === slug)
  const len = siblings.length
  return {
    prev: siblings[(i - 1 + len) % len],
    next: siblings[(i + 1) % len],
  }
}
