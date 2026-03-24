export type SiteVariant = 'main' | 'art' | 'tattoo'

export const SITE_CONFIG = {
  main: {
    title: 'NINA',
    description: 'Art & Tattoo Portfolio',
    nav: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  art: {
    title: 'NINARÒ',
    description: 'Fine Art Portfolio',
    nav: [
      { label: 'Home', href: '/' },
      { label: 'Bio/Contact', href: '/bio-contact' },
      { label: 'Shop', href: '/shop' },
      { label: 'Paintings', href: '/paintings' },
      { label: 'Walls', href: '/walls' },
      { label: 'Installations', href: '/installations' },
      { label: 'Illustration', href: '/illustration' },
      { label: '3D Objects', href: '/3d-objects' },
      { label: 'Workshops', href: '/workshops' },
    ],
  },
  tattoo: {
    title: 'LINEACRUDA',
    description: 'Tattoo Portfolio',
    nav: [
      { label: 'Home', href: '/' },
      { label: 'Bio', href: '/bio' },
      { label: 'Interview/Featuring', href: '/interview-featuring' },
      { label: 'Pics/Videos', href: '/pics-videos' },
      { label: 'Shop', href: '/shop' },
      { label: 'Booking/Waiting List', href: '/booking' },
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
