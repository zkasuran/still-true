import {defineType, defineField} from 'sanity'

export const claimEdge = defineType({
  name: 'claimEdge',
  title: 'Claim relationship',
  type: 'document',
  fields: [
    defineField({
      name: 'relation',
      title: 'Relation',
      type: 'string',
      options: {
        list: [
          {title: 'supports', value: 'supports'},
          {title: 'contradicts', value: 'contradicts'},
          {title: 'supersedes', value: 'supersedes'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'from',
      title: 'From claim',
      type: 'reference',
      to: [{type: 'claim'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'to',
      title: 'To claim',
      type: 'reference',
      to: [{type: 'claim'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reason',
      title: 'Reason',
      description: 'Why these two claims relate this way. This is what a keyword search cannot infer.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'decidedAt',
      title: 'Decided at',
      type: 'datetime',
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      description: '0 to 1. How sure we are this relationship holds.',
      type: 'number',
      validation: (rule) => rule.min(0).max(1),
    }),
  ],
  preview: {
    select: {relation: 'relation', from: 'from.statement', to: 'to.statement'},
    prepare({relation, from, to}) {
      return {
        title: `${from ?? '?'}  —${relation ?? '?'}→  ${to ?? '?'}`,
      }
    },
  },
})
