/**
 * Pigment palette: one sheet of paper with pigment moving through it, and no black anywhere.
 * The hues come from the artist's own originals (the flower icons, the crest's iridescence,
 * the wordmark), so every token below either is one of those colours or sits between them.
 */
export const PIGMENT = {
  /** The main ground. */
  paper: '#EFEBE2',
  /** Raised surfaces: the nav band, card frames. */
  paperLight: '#F6F3EC',
  /** Recessed areas: empty frames, the footer band. */
  linen: '#E3DDD0',
  /** The wordmark lavender. Wings, blooms, light lines on the dark section. */
  lavenderMist: '#C5C8F5',
  /** The icon petals' lavender. */
  petal: '#AAAAC7',
  /** The icons' cool grey ring; a neutral for hairlines and stepped-back labels. */
  ash: '#9F9FA5',
  /** Muted crest blue, for focus rings and accents on the dark section. */
  periwinkle: '#8E97C0',
  /** The crest's violet. Art and large type only (4.1:1 on paper). */
  duskViolet: '#696D9C',
  /** Small labels: the crest violet deepened to 4.5:1 on paper. */
  violetLabel: '#64688F',
  /** Text, headings and the nearest line art (7.6:1 on paper). */
  plumInk: '#4D4560',
  /** The dark (dusk) section. */
  nightViolet: '#2F2E45',
  /** Empty frames on the dark section: night violet lifted a step. */
  frameNight: '#3B3A55',
  /** Greyed sage, like the icons. */
  sageMist: '#CBCCBC',
  /** The green-icon petals. */
  sage: '#969788',
  /** The flower centres. */
  olive: '#919276',
  /** The crest's olive. */
  moss: '#87856B',
} as const

/**
 * The roles the components use. Kept under their earlier names so the components keep
 * one vocabulary; the values are all pigment tokens now.
 */
export const PALETTE = {
  /** Headings, the hero name, key lines and the nearest line art. */
  ink: PIGMENT.plumInk,
  /** Body copy, roles and menu labels at rest (5.7:1 on paper). */
  inkSoft: '#5E5778',
  /** Small uppercase labels; 4.5:1 on paper at 10px. */
  inkMuted: PIGMENT.violetLabel,
  /** Labels stepping back while a sibling is hovered. */
  inkFaint: PIGMENT.ash,
  /** The main ground. */
  paper: PIGMENT.paper,
  /** Raised surfaces. */
  paperLight: PIGMENT.paperLight,
  /** Recessed areas. */
  paperDeep: PIGMENT.linen,
  /** Hairlines: linen leaning toward the icons' grey. */
  rule: '#D3CFCB',
  /** Accent for focus and selection. */
  lavender: PIGMENT.periwinkle,
} as const

/** The ink as an rgb triple, for shadows and translucent washes. */
export const INK_RGB = '77, 69, 96'

/**
 * Depth planes for the line art. Further back is fainter, unshadowed, slower on scroll and
 * runs against the cursor; nearer is darker, shadowed, and follows the page more closely.
 *   alpha:  resting opacity of the drawing
 *   scroll: speed relative to the page (1 = moves with it, 0 = holds still on screen)
 *   cursor: px shift at the viewport edge; negative runs against the cursor
 */
export const PLANES = {
  far: { alpha: 0.07, scroll: 0.35, cursor: -24 },
  mid: { alpha: 0.42, scroll: 0.6, cursor: -14 },
  near: { alpha: 1, scroll: 0.6, cursor: -10 },
} as const
