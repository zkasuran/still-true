import {Suspense, useMemo, useState} from 'react'
import {useCurrentUser, useQuery} from '@sanity/sdk-react'
import {ClaimsList} from './ClaimsList'
import {ClaimDetail} from './ClaimDetail'
import {
  type ClaimConflict,
  type ClaimHandle,
  type EdgeView,
  type Relation,
} from './types'

const EDGES_QUERY = `*[_type == "claimEdge"]{
  _id,
  relation,
  reason,
  confidence,
  decidedAt,
  "fromId": from._ref,
  "toId": to._ref,
  "fromStatement": from->statement,
  "toStatement": to->statement
} | order(relation asc)`

const RELATION_LABEL: Record<Relation, string> = {
  contradicts: 'contradicts',
  supersedes: 'supersedes',
  supports: 'supports',
}

function emptyConflict(): ClaimConflict {
  return {contradicts: [], supersedes: [], supports: []}
}

/** Group every edge onto both of its endpoint claims, keyed by claim id. */
function buildConflictMap(edges: EdgeView[]): Map<string, ClaimConflict> {
  const map = new Map<string, ClaimConflict>()
  const attach = (claimId: string | null, edge: EdgeView) => {
    if (!claimId || !edge.relation) return
    const entry = map.get(claimId) ?? emptyConflict()
    entry[edge.relation].push(edge)
    map.set(claimId, entry)
  }
  for (const edge of edges) {
    attach(edge.fromId, edge)
    attach(edge.toId, edge)
  }
  return map
}

export function TriageDashboard() {
  const user = useCurrentUser()
  const {data: edges, isPending} = useQuery<EdgeView[]>({query: EDGES_QUERY})
  const [selected, setSelected] = useState<ClaimHandle | null>(null)

  const conflictMap = useMemo(() => buildConflictMap(edges ?? []), [edges])

  const contradictions = edges.filter((e) => e.relation === 'contradicts')
  const supersessions = edges.filter((e) => e.relation === 'supersedes')
  const conflicted = new Set<string>()
  for (const e of [...contradictions, ...supersessions]) {
    if (e.fromId) conflicted.add(e.fromId)
    if (e.toId) conflicted.add(e.toId)
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⚖︎</span>
          <div>
            <h1>Contradiction Triage</h1>
            <p className="brand-sub">
              Live view of every claim and the relationships that put them in conflict
            </p>
          </div>
        </div>
        <div className="topbar-meta">
          {isPending && <span className="live-dot" title="Syncing with Content Lake">live</span>}
          {user?.name && <span className="whoami">{user.name}</span>}
        </div>
      </header>

      <section className="stats" aria-label="Summary">
        <Stat value={conflicted.size} label="claims in conflict" tone="danger" />
        <Stat value={contradictions.length} label="contradicts edges" tone="danger" />
        <Stat value={supersessions.length} label="supersedes edges" tone="warn" />
        <Stat value={edges.length} label="relationships total" tone="muted" />
      </section>

      <div className="columns">
        <div className="col col-list">
          <ClaimsList
            conflictMap={conflictMap}
            selectedId={selected?.documentId ?? null}
            onSelect={setSelected}
          />
        </div>

        <div className="col col-detail">
          {selected ? (
            <Suspense fallback={<div className="detail-loading">Loading claim…</div>}>
              <ClaimDetail
                key={selected.documentId}
                handle={selected}
                conflict={conflictMap.get(selected.documentId) ?? emptyConflict()}
              />
            </Suspense>
          ) : (
            <ConflictOverview edges={[...contradictions, ...supersessions]} onSelect={setSelected} />
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({value, label, tone}: {value: number; label: string; tone: string}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

/** Shown before a claim is picked: the full list of conflicting relationships. */
function ConflictOverview({
  edges,
  onSelect,
}: {
  edges: EdgeView[]
  onSelect: (handle: ClaimHandle) => void
}) {
  if (edges.length === 0) {
    return (
      <div className="detail-empty">
        <h2>No conflicts on record</h2>
        <p>Pick a claim on the left to inspect it, or add contradicts/supersedes edges in Studio.</p>
      </div>
    )
  }
  return (
    <div className="overview">
      <h2>Conflicts to work through</h2>
      <p className="overview-sub">Every contradicts and supersedes edge, worst relations first.</p>
      <ul className="edge-feed">
        {edges.map((edge) => (
          <li key={edge._id} className={`edge-card edge-${edge.relation}`}>
            <div className="edge-head">
              <span className={`relation-tag relation-${edge.relation}`}>
                {edge.relation ? RELATION_LABEL[edge.relation] : 'unknown'}
              </span>
              {typeof edge.confidence === 'number' && (
                <span className="edge-conf">{Math.round(edge.confidence * 100)}% sure</span>
              )}
            </div>
            <div className="edge-claims">
              <button
                className="edge-claim-link"
                onClick={() => edge.fromId && onSelect({documentId: edge.fromId, documentType: 'claim'})}
              >
                {edge.fromStatement ?? '(claim removed)'}
              </button>
              <span className="edge-arrow">→</span>
              <button
                className="edge-claim-link"
                onClick={() => edge.toId && onSelect({documentId: edge.toId, documentType: 'claim'})}
              >
                {edge.toStatement ?? '(claim removed)'}
              </button>
            </div>
            {edge.reason && <p className="edge-reason">{edge.reason}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
