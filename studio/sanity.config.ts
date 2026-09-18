import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {workflow} from 'sanity-plugin-workflow'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Asura',

  projectId: 'mx12urdz',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    workflow({
      schemaTypes: ['claim'],
      states: [
        {
          id: 'unverified',
          title: 'Unverified',
          color: 'warning',
          transitions: ['sourced'],
        },
        {
          id: 'sourced',
          title: 'Sourced',
          color: 'primary',
          requireValidation: true,
          transitions: ['confirmed', 'unverified'],
        },
        {
          id: 'confirmed',
          title: 'Confirmed',
          color: 'success',
          roles: ['administrator'],
          transitions: ['sourced'],
        },
      ],
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
