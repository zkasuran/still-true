import {defineType, defineField} from 'sanity'

export const claim = defineType({
  name: 'claim',
  title: 'Claim',
  type: 'document',
  fields: [
    defineField({
      name: 'statement',
      title: 'Statement',
      description: 'One factual claim, stated plainly. Keep it to a single assertion.',
      type: 'string',
      validation: (rule) => rule.required().min(8),
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      description: 'The subject this claim belongs to, so related claims group together.',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Detail',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'primarySource',
      title: 'Primary source',
      type: 'reference',
      to: [{type: 'source'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'supportingSources',
      title: 'Supporting sources',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'source'}]}],
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      description: '0 to 1. How settled this claim is once its sources are weighed.',
      type: 'number',
      validation: (rule) => rule.min(0).max(1),
    }),
    defineField({
      name: 'currentAsOf',
      title: 'Current as of',
      description: 'The date this claim was last known to hold. Older claims can be superseded.',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {title: 'statement', subtitle: 'topic'},
  },
})
