import {defineField, defineType} from 'sanity'

/** Mirrors `Artwork` in the site's lib/artworks.ts. */
export const artwork = defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fieldsets: [
    {
      name: 'display',
      title: 'Display settings',
      description: 'How the image sits in its frame. The defaults suit photographs.',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Used in the page address, e.g. /works/goose-on-fire. Click "Generate".',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: [
          {title: 'Murals', value: 'murals'},
          {title: 'Paintings', value: 'paintings'},
          {title: 'Illustrations', value: 'illustrations'},
          {title: 'Installations', value: 'installations'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'A short description of the image for screen readers and search engines.',
          validation: (rule) => rule.required().warning('Alt text is important for accessibility'),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'series', type: 'string'}),
    defineField({name: 'year', type: 'string'}),
    defineField({name: 'medium', type: 'string', description: 'e.g. Oil on linen'}),
    defineField({name: 'description', type: 'text', rows: 6}),
    defineField({
      name: 'fit',
      title: 'Image fit',
      type: 'string',
      fieldset: 'display',
      description: 'Fill: photo fills the frame. Fit inside: line drawings sit on the background colour.',
      options: {
        list: [
          {title: 'Fill frame', value: 'cover'},
          {title: 'Fit inside', value: 'contain'},
        ],
        layout: 'radio',
      },
      initialValue: 'cover',
    }),
    defineField({
      name: 'tint',
      title: 'Background colour',
      type: 'string',
      fieldset: 'display',
      description: 'Hex colour behind the image, e.g. #2E3352',
      initialValue: '#2E3352',
      validation: (rule) =>
        rule.regex(/^#[0-9a-fA-F]{6}$/, {name: 'hex colour'}).error('Use a hex colour like #2E3352'),
    }),
  ],
  orderings: [
    {title: 'Year, newest first', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
    {title: 'Title A–Z', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', category: 'category', year: 'year', media: 'image'},
    prepare({title, category, year, media}) {
      return {title, subtitle: [category, year].filter(Boolean).join(' · '), media}
    },
  },
})
