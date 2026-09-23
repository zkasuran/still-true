import {useState} from 'react'
import {editDocument, publishDocument} from '@sanity/sdk'
import {
  useApplyDocumentActions,
  useDocument,
  useDocumentProjection,
  useEditDocument,
} from '@sanity/sdk-react'
import {
  type ClaimConflict,
  type ClaimDetailFields,
  type ClaimEditableFields,
  type ClaimHandle,
  type EdgeView,
  type Relation,
  type SourceRef,
} from './types'

const DETAIL_PROJECTION = `{
  statement,
  topic,
  confidence,
  currentAsOf,
  "bodyText": pt::text(body),
  triageReviewed,
  triageReviewedAt,
  "primarySource": primarySource->{_id, title, url, publisher, authority},
  "supportingSources": supportingSources[]->{_id, title, url, publisher, authority}
}`

const REL_LABEL: Record<Relation, string> = {
  contradicts: 'Contradicts',
  supersedes: 'Supersedes / superseded',
  supports: 'Supports',
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.valueOf()) ? '' : d.toLocaleDateString()
}

export function ClaimDetail({handle, conflict}: {handle: ClaimHandle; conflict: ClaimConflict}) {
  const {data: display} = useDocumentProjection<ClaimDetailFields>({
    ...handle,
    projection: DETAIL_PROJECTION,
  })
  // Full document read with optimistic updates, paired with useEditDocument.
  const {data: live} = useDocument<ClaimEditableFields>({...handle})
  const editConfidence = useEditDocument({...handle, path: 'confidence'})
  const apply = useApplyDocumentActions()

  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const liveConfidence = live?.confidence ?? display?.confidence ?? 0
  const reviewed = Boolean(live?.triageReviewed ?? display?.triageReviewed)

  async function run(label: string, work: () => Promise<unknown>) {
    setBusy(label)
    setError(null)
    setStatus(null)
    try {
      await work()
      setStatus(`${label} saved`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const bump = (delta: number) =>
    run(delta > 0 ? 'Raise confidence' : 'Lower confidence', () =>
      apply(editDocument(handle, {set: {confidence: clamp01(liveConfidence + delta)}})),
    )

  const toggleReview = () =>
    run(reviewed ? 'Clear review flag' : 'Mark reviewed', () =>
      apply(
        editDocument(
          handle,
          reviewed
            ? {unset: ['triageReviewed', 'triageReviewedAt']}
            : {set: {triageReviewed: true, triageReviewedAt: new Date().toISOString()}},
        ),
      ),
    )

  const publish = () => run('Publish', () => apply(publishDocument(handle)))

  return (
    <article className="detail">
      <div className="detail-head">
        <span className={`review-chip${reviewed ? ' is-on' : ''}`}>
          {reviewed ? '✓ reviewed' : 'unreviewed'}
        </span>
        <h2>{display?.statement ?? '(untitled claim)'}</h2>
        <div className="detail-tags">
          {display?.topic && <span className="tag">{display.topic}</span>}
          {display?.currentAsOf && (
            <span className="tag tag-date">current as of {formatDate(display.currentAsOf)}</span>
          )}
        </div>
      </div>

      {display?.bodyText && <p className="detail-body">{display.bodyText}</p>}

      <section className="sources">
        <h3>Sources</h3>
        {display?.primarySource ? (
          <SourceLine role="primary" source={display.primarySource} />
        ) : (
          <p className="muted">No primary source set.</p>
        )}
        {(display?.supportingSources ?? []).map((s) => (
          <SourceLine key={s._id} role="supporting" source={s} />
        ))}
      </section>

      <section className="editor">
        <h3>Triage confidence</h3>
        <div className="conf-editor">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={liveConfidence}
            onChange={(e) => editConfidence(Number(e.currentTarget.value))}
          />
          <span className="conf-readout">{Math.round(liveConfidence * 100)}%</span>
        </div>
        <p className="hint">Drag to write confidence live via useEditDocument (debounced).</p>

        <div className="actions">
          <button disabled={busy != null} onClick={() => bump(-0.1)}>
            − 0.1
          </button>
          <button disabled={busy != null} onClick={() => bump(0.1)}>
            + 0.1
          </button>
          <button
            className={reviewed ? 'btn-warn' : 'btn-primary'}
            disabled={busy != null}
            onClick={toggleReview}
          >
            {reviewed ? 'Clear flag' : 'Mark reviewed'}
          </button>
          <button className="btn-publish" disabled={busy != null} onClick={publish}>
            Publish
          </button>
        </div>
        <p className="action-note">
          Buttons apply editDocument / publishDocument through useApplyDocumentActions.
        </p>
        {busy && <p className="status busy">{busy}…</p>}
        {status && <p className="status ok">{status}</p>}
        {error && <p className="status err">{error}</p>}
      </section>

      <RelatedEdges thisId={handle.documentId} conflict={conflict} />
    </article>
  )
}

function SourceLine({role, source}: {role: 'primary' | 'supporting'; source: SourceRef}) {
  return (
    <div className="source-line">
      <span className={`source-role role-${role}`}>{role}</span>
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer" className="source-title">
          {source.title ?? source.url}
        </a>
      ) : (
        <span className="source-title">{source.title ?? '(untitled source)'}</span>
      )}
      {source.publisher && <span className="source-pub">{source.publisher}</span>}
      {source.authority && (
        <span className={`authority authority-${source.authority}`}>{source.authority}</span>
      )}
    </div>
  )
}

function RelatedEdges({thisId, conflict}: {thisId: string; conflict: ClaimConflict}) {
  const groups: [Relation, EdgeView[]][] = [
    ['contradicts', conflict.contradicts],
    ['supersedes', conflict.supersedes],
    ['supports', conflict.supports],
  ]
  const total = conflict.contradicts.length + conflict.supersedes.length + conflict.supports.length
  if (total === 0) {
    return (
      <section className="related">
        <h3>Relationships</h3>
        <p className="muted">This claim has no edges yet.</p>
      </section>
    )
  }
  return (
    <section className="related">
      <h3>Relationships</h3>
      {groups.map(([relation, edges]) =>
        edges.length === 0 ? null : (
          <div key={relation} className="related-group">
            <h4 className={`related-label relation-${relation}`}>{REL_LABEL[relation]}</h4>
            <ul>
              {edges.map((edge) => {
                const outgoing = edge.fromId === thisId
                const other = outgoing ? edge.toStatement : edge.fromStatement
                return (
                  <li key={edge._id} className={`related-edge edge-${relation}`}>
                    <span className="related-dir">{outgoing ? 'this →' : '→ this'}</span>
                    <span className="related-other">{other ?? '(claim removed)'}</span>
                    {edge.reason && <p className="related-reason">{edge.reason}</p>}
                  </li>
                )
              })}
            </ul>
          </div>
        ),
      )}
    </section>
  )
}


