import { prisma } from './prisma'
import { CandidateStatus, Prisma } from '@prisma/client'

// This is a TypeScript "type alias": it says CandidateStatusFilter can ONLY
// ever be one of these three exact strings. If you typo 'pendng' anywhere,
// TypeScript will refuse to compile — that's the whole point of using it
// instead of a plain `string`.
export type CandidateStatusFilter = 'none' | 'pending' | 'accepted' | 'refused' | 'all'

const STATUS_TO_DB: Record<CandidateStatusFilter, any> = {
  none: null,
  pending: 'en_attente',
  accepted: 'accepte',
  refused: 'refuse',
  all: { not: null },
}

const PAGE_SIZE = 10

// An "interface" describes the shape of an object — every CandidateListItem
// MUST have exactly these fields, with these types. This is the shape our
// UI components will actually receive; it's already "flattened" and
// computed, so the components don't need to know about assignments/
// evaluations at all.
export interface CandidateListItem {
  id: number
  fullName: string
  email: string | null
  extraLine: string | null // TODO: pull from `extraData` once we know which CSV column to show (e.g. school/filière)
  finalStatus: CandidateStatus | null
  evaluationsCompleted: number
  evaluationsRequired: number
  commentCount: number
}

export interface CandidatePage {
  items: CandidateListItem[]
  nextCursor: number | null
  totalMatching: number
}

interface GetCandidatesArgs {
  eventId: number
  status: CandidateStatusFilter
  search?: string
  cursor?: number | null
  pageSize?: number
}

/**
 * Fetches one page of candidates for a given event + status (+ optional
 * search text), using "cursor" pagination: instead of saying "give me page
 * 3", we say "give me everything after candidate #57". This is more robust
 * than offset-based pagination (page numbers shift if a candidate gets
 * added/removed between requests) and is the standard approach for
 * "Load more" style UIs.
 */
export async function getCandidates({
  eventId,
  status,
  search,
  cursor,
  pageSize = PAGE_SIZE,
}: GetCandidatesArgs): Promise<CandidatePage> {
  const finalStatus = STATUS_TO_DB[status]

  const where: Prisma.CandidateWhereInput = {
    eventId,
    finalStatus,
    ...(search
      ? {
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  // Promise.all runs these three database calls in parallel instead of
  // one-after-another — they don't depend on each other, so there's no
  // reason to wait for one to finish before starting the next.
  const [rows, totalMatching, event] = await Promise.all([
    prisma.candidate.findMany({
      where,
      orderBy: { id: 'asc' },
      // cursor pagination: "skip 1, starting right after this id"
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: pageSize + 1, // fetch ONE extra row, just to know if there's more after this page
      include: {
        assignments: {
          include: { evaluation: true },
        },
      },
    }),
    prisma.candidate.count({ where }),
    prisma.event.findUniqueOrThrow({ where: { id: eventId } }),
  ])

  const hasMore = rows.length > pageSize
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows
  const evaluationsRequired = event.nbEvalRh + event.nbEvalTechnique

  const items: CandidateListItem[] = pageRows.map((c) => {
    const evaluations = c.assignments
      .map((a) => a.evaluation)
      .filter((e): e is NonNullable<typeof e> => e !== null)

    const evaluationsCompleted = evaluations.filter((e) => e.decision !== null).length
    const commentCount = evaluations.filter((e) => !!e.comment?.trim()).length

    const extraData = c.extraData as Record<string, any> | null
    const ecole = extraData?.ecole ? String(extraData.ecole) : null

    return {
      id: c.id,
      fullName: [c.prenom, c.nom].filter(Boolean).join(' ') || '(no name)',
      email: c.email,
      extraLine: ecole,
      finalStatus: c.finalStatus,
      evaluationsCompleted,
      evaluationsRequired,
      commentCount,
    }
  })

  return {
    items,
    nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null,
    totalMatching,
  }
}

/**
 * Called when the admin picks a decision from the dropdown on the
 * "To be reviewed" page. This directly sets the candidate's finalStatus —
 * it does NOT touch individual selector evaluations, which stay as a
 * separate record of who said what.
 */
export async function setCandidateDecision(candidateId: number, status: 'accepted' | 'refused' | 'pending' | 'none') {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUnique({ where: { id: candidateId } })
    if (!candidate) throw new Error('Candidate not found')

    const dbStatus = STATUS_TO_DB[status]

    const updated = await tx.candidate.update({
      where: { id: candidateId },
      data: { finalStatus: dbStatus },
    })

    if (candidate.finalStatus !== dbStatus) {
      await tx.log.create({
        data: {
          action: 'UPDATE_CANDIDATE_DECISION',
          entityType: 'Candidate',
          entityId: candidateId,
          details: { previousStatus: candidate.finalStatus, newStatus: dbStatus },
        },
      })
    }

    return updated
  })
}
