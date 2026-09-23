import {Suspense, useState} from 'react'
import {usePaginatedDocuments} from '@sanity/sdk-react'
import {ClaimRow} from './ClaimRow'
import {type ClaimConflict, type ClaimHandle} from './types'

const PAGE_SIZE = 20

export function ClaimsList({
  conflictMap,
  selectedId,
  onSelect,
}: {
  conflictMap: Map<string, ClaimConflict>
  selectedId: string | null
  onSelect: (handle: ClaimHandle) => void
}) {
  const [term, setTerm] = useState('')
  const query = term.trim()

  const {
    data: handles,
    currentPage,
    totalPages,
    count,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
    isPending,
  } = usePaginatedDocuments({
    documentType: 'claim',
    pageSize: PAGE_SIZE,
    // Lowest confidence first: the shakiest claims are the ones to triage.
    orderings: [{field: 'confidence', direction: 'asc'}],
    filter: query ? '(statement match $q) || (topic match $q)' : undefined,
    params: query ? {q: `${query}*`} : undefined,
  })

  return (
    <div className="claims">
      <div className="claims-head">
        <h2>
          Claims{' '}
          <span className="count-pill">{count}</span>
        </h2>
        <input
          className="search"
          type="search"
          placeholder="Filter by statement or topic…"
          value={term}
          onChange={(e) => setTerm(e.currentTarget.value)}
        />
      </div>

      {handles.length === 0 ? (
        <p className="claims-empty">{query ? 'No claims match that filter.' : 'No claims yet.'}</p>
      ) : (
        <ul className="claim-rows" aria-busy={isPending}>
          {handles.map((handle) => (
            <Suspense
              key={handle.documentId}
              fallback={<li className="claim-row claim-row-skeleton" />}
            >
              <ClaimRow
                handle={handle}
                conflict={conflictMap.get(handle.documentId)}
                selected={handle.documentId === selectedId}
                onSelect={onSelect}
              />
            </Suspense>
          ))}
        </ul>
      )}

      <div className="pager">
        <button onClick={previousPage} disabled={!hasPreviousPage}>
          ← Prev
        </button>
        <span className="pager-info">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next →
        </button>
      </div>
    </div>
  )
}
