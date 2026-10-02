'use client'

import { useEffect, useState } from 'react'
import type { CandidateDetail } from '@/lib/candidate-detail'
import styles from './CandidateDetailModal.module.css'

interface Props {
  candidateId: number
  onClose: () => void
}

export function CandidateDetailModal({ candidateId, onClose }: Props) {
  const [detail, setDetail] = useState<CandidateDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)
    fetch(`/api/candidates/${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch candidate details')
        return res.json()
      })
      .then((data: CandidateDetail) => {
        if (!cancelled) {
          setDetail(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [candidateId])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {isLoading && <p>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!isLoading && !error && detail && (
          <>
            <h2>{detail.fullName}</h2>

            <section className={styles.section}>
              <h3>Contact</h3>
              <p>{detail.email ?? '(no email)'}</p>
              <p>{detail.telephone ?? '(no phone)'}</p>
            </section>

            {detail.extraData && Object.keys(detail.extraData).length > 0 && (
              <section className={styles.section}>
                <h3>Additional info</h3>
                {Object.entries(detail.extraData).map(([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </p>
                ))}
              </section>
            )}

            <section className={styles.section}>
              <h3>Evaluations</h3>
              {detail.evaluations.length === 0 && <p>No selectors assigned yet.</p>}
              {detail.evaluations.map((ev, i) => (
                <div key={i} className={styles.evaluation}>
                  <div>
                    <strong>{ev.selectorName}</strong>{' '}
                    <span className={styles.selectorType}>({ev.selectorType})</span>
                  </div>
                  <div>
                    Decision:{' '}
                    {ev.decision === 'accepter'
                      ? 'Accepted'
                      : ev.decision === 'rejeter'
                        ? 'Rejected'
                        : ev.decision === 'en_attente'
                          ? 'Pending'
                          : 'Not evaluated yet'}
                  </div>
                  {ev.comment && <div>Comment: {ev.comment}</div>}
                  {ev.evaluatedAt && (
                    <div className={styles.timestamp}>
                      {new Date(ev.evaluatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
