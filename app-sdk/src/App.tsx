import {Suspense} from 'react'
import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {TriageDashboard} from './TriageDashboard'
import {DATASET, PROJECT_ID} from './types'
import './styles.css'

// The app can read from many projects. This one triages a single content lake.
const sanityConfigs: SanityConfig[] = [
  {
    projectId: PROJECT_ID,
    dataset: DATASET,
  },
]

function AppFallback({label}: {label: string}) {
  return (
    <div className="app-loading">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <SanityApp config={sanityConfigs} fallback={<AppFallback label="Connecting to Sanity…" />}>
        <Suspense fallback={<AppFallback label="Loading claims and relationships…" />}>
          <TriageDashboard />
        </Suspense>
      </SanityApp>
    </div>
  )
}
