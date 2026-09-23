import {useDocumentProjection} from '@sanity/sdk-react'
import {type ClaimConflict, type ClaimHandle, type ClaimRowFields} from './types'

const ROW_PROJECTION = `{statement, topic, confidence}`

function confidenceTone(value: number | null): string {
  if (value == null) return 'unknown'
  if (value < 0.34) return 'low'
  if (value < 0.67) return 'mid'
  return 'high'
}

export function ClaimRow({
  handle,
  conflict,
  selected,
  onSelect,
}: {
  handle: ClaimHandle
  conflict: ClaimConflict | undefined
  selected: boolean
  onSelect: (handle: ClaimHandle) => void
}) {
  const {data} = useDocumentProjection<ClaimRowFields>({
    ...handle,
    projection: ROW_PROJECTION,
  })

  const statement = data?.statement ?? '(untitled claim)'
  const topic = data?.topic ?? null
  const confidence = data?.confidence ?? null
  const contradicts = conflict?.contradicts.length ?? 0
  const supersedes = conflict?.supersedes.length ?? 0
  const flagged = contradicts + supersedes > 0

  return (
    <li className={`claim-row${selected ? ' is-selected' : ''}${flagged ? ' is-flagged' : ''}`}>
      <button className="claim-row-btn" onClick={() => onSelect(handle)}>
        <div className="claim-row-top">
          <span className="claim-statement">{statement}</span>
          {flagged && (
            <span className="row-flags">
              {contradicts > 0 && (
                <span className="row-flag flag-contradicts" title="contradicts edges">
                  ✕ {contradicts}
                </span>
              )}
              {supersedes > 0 && (
                <span className="row-flag flag-supersedes" title="supersedes edges">
                  ↻ {supersedes}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="claim-row-bottom">
          {topic && <span className="claim-topic">{topic}</span>}
          <span className={`conf conf-${confidenceTone(confidence)}`}>
            {confidence == null ? 'no confidence' : `${Math.round(confidence * 100)}%`}
          </span>
        </div>
      </button>
    </li>
  )
}
