export type SiteVariant = 'main' | 'art' | 'tattoo'

export const SITE_CONFIG = {
  main: {
    title: 'Artist Name',
    description: 'Art & Tattoo Portfolio',
    nav: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  art: {
    title: 'Artist Name - Art',
    description: 'Fine Art Portfolio',
    nav: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  tattoo: {
    title: 'Artist Name - Tattoo',
    description: 'Tattoo Portfolio',
    nav: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
}

export const CONTENT = {
  art: {
    heroTitle: 'Contemporary Abstract',
    heroSubtitle: 'Exploring the void through texture and form.',
    about: {
      title: 'About the Art',
      bio: `I approach fine art with a focus on raw emotion and texture. My work spans mixed media, oil, and digital installations. It is an exploration of the spaces between thoughts -> the silence.`,
      image: '/placeholder-art-about.jpg',
    },
  },
  tattoo: {
    heroTitle: 'Permanent Ink',
    heroSubtitle: 'Custom designs for your narrative.',
    about: {
      title: 'About the Ink',
      bio: `Tattooing is a ritual. I specialize in blackwork, fine line, and surrealism. Every piece is a collaboration, designed to fit the body's natural flow and the client's personal story.`,
      image: '/placeholder-tattoo-about.jpg',
    },
  },
}
