'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { CandidateListItem, CandidateStatusFilter } from '@/lib/candidates'
import { CandidateDetailModal } from './CandidateDetailModal'
import CustomDropdown from '@/components/CustomDropdown'
import styles from './CandidateList.module.css'

/**
 * `import styles from './CandidateList.module.css'` gives you an object
 * where each key matches a class name from that file - so `.row` in the
 * CSS becomes `styles.row` here. Then `className={styles.row}` applies it.
 * This is the CSS Modules pattern, and it's why nothing changed about the
 * component's LOGIC below, just which className strings get used.
 */

interface Props {
  eventId: number
  status: CandidateStatusFilter
  initialItems: CandidateListItem[]
  initialNextCursor: number | null
  initialTotal: number
  showDecisionControl?: boolean
  showStatusSwitch?: boolean
  searchQuery?: string
  autoFetch?: boolean
  layoutMode?: 'to-review' | 'decision-status'
}

export function CandidateList({
  eventId,
  status: initialStatus,
  initialItems,
  initialNextCursor,
  initialTotal,
  showDecisionControl = false,
  showStatusSwitch = false,
  searchQuery,
  autoFetch = false,
  layoutMode = 'to-review',
}: Props) {
  const searchParams = useSearchParams()
  const currentSearch = searchQuery !== undefined ? searchQuery : (searchParams.get('search') || '')
  
  const [status, setStatus] = useState<CandidateStatusFilter>(initialStatus)
  const [items, setItems] = useState(initialItems)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [total, setTotal] = useState(initialTotal)
  const [isPending, startTransition] = useTransition()
  const [openCandidateId, setOpenCandidateId] = useState<number | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!autoFetch) {
      setItems(initialItems)
      setNextCursor(initialNextCursor)
      setTotal(initialTotal)
      setStatus(initialStatus)
    }
  }, [initialItems, initialNextCursor, initialTotal, initialStatus, autoFetch])

  useEffect(() => {
    if (autoFetch) {
      fetchPage({ reset: true, searchValue: currentSearch, statusValue: status })
    }
  }, [currentSearch, status, autoFetch])

  async function fetchPage(opts: {
    reset: boolean
    searchValue?: string
    statusValue?: CandidateStatusFilter
  }) {
    const searchValue = opts.searchValue ?? currentSearch
    const statusValue = opts.statusValue ?? status

    const url = new URL(`/api/events/${eventId}/candidates-paginated`, window.location.origin)
    url.searchParams.set('status', statusValue)
    if (searchValue) url.searchParams.set('search', searchValue)
    if (!opts.reset && nextCursor) url.searchParams.set('cursor', String(nextCursor))

    const res = await fetch(url.toString())
    const page = await res.json()

    setItems((prev) => (opts.reset ? page.items : [...prev, ...page.items]))
    setNextCursor(page.nextCursor)
    setTotal(page.totalMatching)
  }

  function handleStatusSwitch(value: CandidateStatusFilter) {
    setStatus(value)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('status', value)
    router.push(`${pathname}?${newParams.toString()}`)
  }

  async function handleDecisionChange(candidateId: number, value: 'accepted' | 'refused' | 'pending' | 'none') {
    await fetch(`/api/candidates/${candidateId}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: value }),
    })

    setItems((prev) => {
      if (status === 'all') {
        const newStatus = value === 'none' ? null : value === 'accepted' ? 'accepte' : value === 'refused' ? 'refuse' : 'en_attente'
        return prev.map((c) => c.id === candidateId ? { ...c, finalStatus: newStatus as any } : c)
      }
      return prev.filter((c) => c.id !== candidateId)
    })
    
    if (status !== 'all') {
      setTotal((t) => t - 1)
    }
  }

  return (
    <div>
      <div className={styles.controls}>
        {showStatusSwitch && (
          <CustomDropdown
            value={status}
            onChange={(val) => handleStatusSwitch(val as CandidateStatusFilter)}
            options={[
              { label: 'All', value: 'all', color: '#8a8a8a', bgColor: '#f0f1f3' },
              { label: 'Pending', value: 'pending', color: '#8a8a8a', bgColor: '#f0f1f3' },
              { label: 'Accepted', value: 'accepted', color: '#1AAF5D', bgColor: '#e5f7ed' },
              { label: 'Refused', value: 'refused', color: '#C1333F', bgColor: '#faeaea' },
            ]}
          />
        )}
      </div>

      {items.length === 0 && !isPending && (
        <div className={styles.emptyState}>No candidates match your search.</div>
      )}

      {items.map((c) => {
        const progressPct =
          c.evaluationsRequired > 0
            ? Math.min(100, (c.evaluationsCompleted / c.evaluationsRequired) * 100)
            : 0

        return (
          <div key={c.id} className={styles.row}>
            <div className={styles.avatar} />

            <div className={styles.identity}>
              <strong>{c.fullName}</strong>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>{c.email}</div>
              {c.extraLine && <div style={{ fontSize: "12px", color: "#6B7280" }}>{c.extraLine}</div>}
            </div>

            {layoutMode === 'to-review' ? (
              // This represents the "To be reviewed" page Layout
              <>
                <div className={styles.progressAndCommentsWrap}>
                  <div className={styles.progressBar}>
                    {progressPct > 0 && (
                      <div className={styles.progressFill} style={{ width: `${progressPct}%` }}>
                        <span className={styles.progressTextFill}>
                          {c.evaluationsCompleted}/{c.evaluationsRequired}
                        </span>
                      </div>
                    )}
                    {progressPct === 0 && (
                       <span className={styles.progressTextEmpty}>
                         {c.evaluationsCompleted}/{c.evaluationsRequired}
                       </span>
                    )}
                  </div>
                  <div className={styles.commentsTextUnderBar}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9CA3AF" }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>{c.commentCount} Comments</span>
                  </div>
                </div>

                {showDecisionControl ? (
                  <CustomDropdown
                    className={styles.decisionDropdown}
                    value={
                      c.finalStatus === null
                        ? 'none'
                        : c.finalStatus === 'accepte'
                        ? 'accepted'
                        : c.finalStatus === 'refuse'
                        ? 'refused'
                        : 'pending'
                    }
                    placeholder="Select decision"
                    onChange={(val) => handleDecisionChange(c.id, val as 'accepted' | 'refused' | 'pending' | 'none')}
                    options={[
                      { label: 'Pending', value: 'pending', color: '#8a8a8a', bgColor: '#f0f1f3' },
                      { label: 'Accepted', value: 'accepted', color: '#1AAF5D', bgColor: '#e5f7ed' },
                      { label: 'Refused', value: 'refused', color: '#C1333F', bgColor: '#faeaea' },
                    ]}
                  />
                ) : (
                  <div style={{ flex: '0 0 150px' }} />
                )}
              </>
            ) : (
              // This represents the "Decision status" page Layout
              <>
                <div className={styles.commentsDecisionPage}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9CA3AF" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Comments</span>
                </div>

                {c.finalStatus === 'en_attente' ? (
                  <span className={`${styles.badge} ${styles.badgePending}`}>
                    • Pending
                  </span>
                ) : (
                  <span
                    className={`${styles.badge} ${
                      c.finalStatus === 'accepte' ? styles.badgeAccepte : styles.badgeRefuse
                    }`}
                  >
                    {c.finalStatus === 'accepte' ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Accepted
                      </>
                    ) : (
                      '✕ Refused'
                    )}
                  </span>
                )}
              </>
            )}

            <button
              className={styles.arrowButton}
              aria-label="View details"
              onClick={() => setOpenCandidateId(c.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>
        )
      })}

      {nextCursor && (
        <button
          className={styles.showMoreButton}
          disabled={isPending}
          onClick={() => fetchPage({ reset: false })}
        >
          Show more ({Math.max(total - items.length, 0)} left)
        </button>
      )}

      {openCandidateId !== null && (
        <CandidateDetailModal
          candidateId={openCandidateId}
          onClose={() => setOpenCandidateId(null)}
        />
      )}
    </div>
  )
}
