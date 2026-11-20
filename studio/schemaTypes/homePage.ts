import {defineArrayMember, defineField, defineType} from 'sanity'

/** Singleton: the NINARÒ front page (components/NinaroHome.tsx). */
export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    defineField({
      name: 'selectedWorkHeading',
      title: 'Selected work: heading',
      type: 'string',
      initialValue: 'Selected work',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'selectedWorkYears',
      title: 'Selected work: year range',
      type: 'string',
      description: 'Shown at the right of the heading line, e.g. 2021 — 2026',
      initialValue: '2021 — 2026',
    }),
    defineField({
      name: 'featuredWorks',
      title: 'Selected work: cards',
      type: 'array',
      description:
        'The front page layout has six card slots, filled in this order. Drag to reorder.',
      of: [
        defineArrayMember({
          name: 'featuredWork',
          title: 'Card',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Category label',
              type: 'string',
              description: 'Small text beside the title, e.g. Murals',
            }),
            defineField({
              name: 'link',
              title: 'Links to',
              type: 'string',
              options: {
                list: [
                  {title: 'Murals', value: '/walls'},
                  {title: 'Paintings', value: '/paintings'},
                  {title: 'Illustration', value: '/illustration'},
                  {title: 'Installations', value: '/installations'},
                  {title: 'Stage design', value: '/stage-design'},
                  {title: 'Workshops', value: '/workshops'},
                ],
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
                  validation: (rule) =>
                    rule.required().warning('Alt text is important for accessibility'),
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'label', media: 'image'},
          },
        }),
      ],
      validation: (rule) => rule.max(6),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Home Page'}),
  },
})
