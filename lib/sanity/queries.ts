import type { SanityImageSource } from '@sanity/image-url'
import type { ArtCategory, Artwork } from '@/lib/artworks'
import { sanityFetch } from './client'
import { hotspotPosition, imageUrl } from './image'

type SanityImage = SanityImageSource & { asset?: unknown; hotspot?: { x: number; y: number } | null }

const CATEGORIES: ArtCategory[] = ['murals', 'paintings', 'illustrations', 'installations']

/** Section pages a front page card may link to — anything else falls back to the slot's default. */
export const HOME_CARD_LINKS = [
  '/walls',
  '/paintings',
  '/illustration',
  '/installations',
  '/stage-design',
  '/workshops',
] as const

// --- Artworks ---

const ARTWORKS_QUERY = `*[_type == "artwork" && defined(slug.current) && defined(image.asset)]
  | order(year desc, _createdAt desc) {
    title, "slug": slug.current, series, year, medium, category, image, fit, tint, description
  }`

type ArtworkResult = {
  title: string
  slug: string
  series?: string
  year?: string
  medium?: string
  category?: string
  image: SanityImage
  fit?: 'cover' | 'contain'
  tint?: string
  description?: string
}

/** Published Sanity artworks in the site's `Artwork` shape, or `null` if Sanity is unreachable. */
export async function fetchSanityArtworks(): Promise<Artwork[] | null> {
  const rows = await sanityFetch<ArtworkResult[]>(ARTWORKS_QUERY)
  if (!rows) return null
  return rows
    .filter((r) => CATEGORIES.includes(r.category as ArtCategory))
    .map((r) => ({
      slug: r.slug,
      title: r.title ?? '',
      series: r.series ?? '',
      year: r.year ?? '',
      medium: r.medium ?? '',
      category: r.category as ArtCategory,
      image: imageUrl(r.image),
      objectPosition: hotspotPosition(r.image.hotspot),
      fit: r.fit ?? 'cover',
      tint: r.tint ?? '#2E3352',
      description: r.description ?? '',
    }))
}

// --- Home page ---

export interface HomeCard {
  title?: string
  label?: string
  href?: string
  image?: string
  objectPosition?: string
}

export interface SelectedWork {
  heading?: string
  years?: string
  cards: HomeCard[]
}

const HOME_QUERY = `*[_id == "homePage"][0]{
  selectedWorkHeading, selectedWorkYears,
  featuredWorks[]{ title, label, link, image }
}`

type HomeResult = {
  selectedWorkHeading?: string
  selectedWorkYears?: string
  featuredWorks?: { title?: string; label?: string; link?: string; image?: SanityImage }[]
} | null

export async function fetchSelectedWork(): Promise<SelectedWork | null> {
  const doc = await sanityFetch<HomeResult>(HOME_QUERY)
  if (!doc) return null
  return {
    heading: doc.selectedWorkHeading || undefined,
    years: doc.selectedWorkYears || undefined,
    cards: (doc.featuredWorks ?? []).slice(0, 6).map((c) => ({
      title: c.title || undefined,
      label: c.label || undefined,
      href: (HOME_CARD_LINKS as readonly string[]).includes(c.link ?? '') ? c.link : undefined,
      image: c.image?.asset ? imageUrl(c.image, 1600) : undefined,
      objectPosition: hotspotPosition(c.image?.hotspot),
    })),
  }
}

// --- About (NINARÒ) ---

export interface AboutContent {
  title: string
  bio: string
  image: string
}

const ABOUT_QUERY = `*[_id == "about-art"][0]{ title, bio, image }`

type AboutResult = { title?: string; bio?: string; image?: SanityImage } | null

/** About (NINARÒ) with any missing field taken from `fallback`. */
export async function fetchArtAbout(fallback: AboutContent): Promise<AboutContent> {
  const doc = await sanityFetch<AboutResult>(ABOUT_QUERY)
  return {
    title: doc?.title || fallback.title,
    bio: doc?.bio || fallback.bio,
    image: doc?.image?.asset ? imageUrl(doc.image, 1600) : fallback.image,
  }
}
