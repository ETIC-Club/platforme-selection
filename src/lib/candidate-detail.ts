import { prisma } from './prisma'

export interface CandidateDetailEvaluation {
  selectorName: string
  selectorType: 'RH' | 'Technique'
  decision: 'accepter' | 'rejeter' | 'en_attente' | null
  comment: string | null
  evaluatedAt: string | null // ISO string - dates get serialized to strings once they cross into JSON
}

export interface CandidateDetail {
  id: number
  fullName: string
  nom: string | null
  prenom: string | null
  email: string | null
  telephone: string | null
  extraData: Record<string, unknown> | null
  evaluations: CandidateDetailEvaluation[]
  createdAt: string
  finalStatus: string | null
}

/**
 * Walks the same chain as getCandidates() (Candidate -> Assignment ->
 * Evaluation) but also reaches one hop further, into EventSelector -> User,
 * to get the human name and RH/Technique label for whoever did the
 * evaluating. That's why the `include` here is one level deeper than the
 * one in candidates.ts.
 */
export async function getCandidateDetail(candidateId: number): Promise<CandidateDetail | null> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      assignments: {
        include: {
          evaluation: true,
          eventSelector: {
            include: { user: true },
          },
        },
      },
    },
  })

  if (!candidate) return null

  const evaluations: CandidateDetailEvaluation[] = candidate.assignments.map((a) => ({
    selectorName: a.eventSelector.user.fullName ?? a.eventSelector.user.email,
    selectorType: a.eventSelector.selectorType,
    decision: a.evaluation?.decision ?? null,
    comment: a.evaluation?.comment ?? null,
    evaluatedAt: a.evaluation?.evaluatedAt?.toISOString() ?? null,
  }))

  return {
    id: candidate.id,
    fullName: [candidate.prenom, candidate.nom].filter(Boolean).join(' ') || '(no name)',
    email: candidate.email,
    telephone: candidate.telephone,
    // Prisma's Json fields come back typed as `JsonValue` - this cast just
    // tells TypeScript "trust me, it's a plain object", which it is here
    // since that's how extraData gets stored from the CSV import.
    extraData: candidate.extraData as Record<string, unknown> | null,
    evaluations,
    nom: candidate.nom,
    prenom: candidate.prenom,
    createdAt: candidate.createdAt.toISOString(),
    finalStatus: candidate.finalStatus,
  }
}
