import {defineType, defineField} from 'sanity'

export const source = defineType({
  name: 'source',
  title: 'Source',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher',
      description: 'Who published this: the vendor, a standards body, a blog, a forum poster.',
      type: 'string',
    }),
    defineField({
      name: 'authority',
      title: 'Authority',
      description: 'How much weight this source carries when two sources disagree.',
      type: 'string',
      options: {
        list: [
          {title: 'Official (vendor / spec)', value: 'official'},
          {title: 'Maintainer statement', value: 'maintainer'},
          {title: 'Community / blog', value: 'community'},
          {title: 'Unknown', value: 'unknown'},
        ],
        layout: 'radio',
      },
      initialValue: 'unknown',
    }),
    defineField({
      name: 'sourceType',
      title: 'Kind',
      type: 'string',
      options: {
        list: ['docs', 'changelog', 'spec', 'blog', 'forum', 'other'],
      },
      initialValue: 'docs',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      description: 'When this source was published or last updated. Recency breaks ties.',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'publisher'},
  },
})
