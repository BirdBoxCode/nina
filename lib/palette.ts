/**
 * Organic palette: ink on paper. One warm ink in three strengths for the type and lines,
 * the paper in three tones for ground and surfaces, and the crest's lavender as the single
 * accent, used sparingly (focus, selection, the tip of a travelling line).
 */
export const PALETTE = {
  /** Headings, the hero name, key lines and the nearest line art. */
  ink: '#3A3631',
  /** Body copy, roles and menu labels at rest. */
  inkSoft: '#5E5951',
  /** Small uppercase labels; still 4.5:1 on paper at 10px. */
  inkMuted: '#6F6A61',
  /** Labels stepping back while a sibling is hovered. */
  inkFaint: '#ABA598',
  /** The main ground. */
  paper: '#EFEBE2',
  /** Raised surfaces: the nav band, card frames. */
  paperLight: '#F6F3EC',
  /** Recessed areas: empty image frames, the footer band. */
  paperDeep: '#E4DFD3',
  /** Hairlines. */
  rule: '#CFC9BC',
  /** The crest's side colour. */
  lavender: '#8E90C4',
} as const

/** The ink as an rgb triple, for shadows and translucent washes. */
export const INK_RGB = '58, 54, 49'

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
