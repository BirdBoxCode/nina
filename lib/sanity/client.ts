import { createClient } from '@sanity/client'

// Public project details (not secret). Defaults keep the build working without env vars.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'uwv312wx'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-11-01',
  useCdn: true,
  perspective: 'published',
})

/** Published edits show up on the site within this many seconds — no redeploy needed. */
const REVALIDATE_SECONDS = 60

/** Cached fetch. Returns `null` on any failure so pages fall back to their built-in copy. */
export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  try {
    return await client.fetch<T>(query, params, { next: { revalidate: REVALIDATE_SECONDS } })
  } catch (err) {
    console.error('[sanity] fetch failed', err)
    return null
  }
}
