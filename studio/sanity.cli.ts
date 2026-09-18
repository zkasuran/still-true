import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'mx12urdz',
    dataset: 'production'
  },
  studioHost: 'still-true-asura',
  deployment: {
    autoUpdates: true,
  },
})
