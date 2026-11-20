import type {StructureResolver} from 'sanity/structure'

/** Singleton types: one fixed document each, never created from the "+" menu. */
export const SINGLETON_TYPES = new Set(['homePage', 'about'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Website Content')
    .items([
      S.listItem()
        .title('Home Page')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home Page')),
      S.listItem()
        .title('About (NINARÒ)')
        .id('about-art')
        .child(S.document().schemaType('about').documentId('about-art').title('About (NINARÒ)')),

      S.divider(),

      S.documentTypeListItem('artwork').title('Artworks'),
    ])
