import { NextRequest, NextResponse } from 'next/server'
import { getCandidateDetail } from '@/lib/candidate-detail'

/**
 * GET /api/candidates/42
 *
 * Note this lives at app/api/candidates/[candidateId]/route.ts - one level
 * up from the PATCH /decision route you already have. Both can coexist:
 * Next.js matches GET and PATCH on the same URL to different route.ts
 * files depending on which folder they're actually in.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId: candidateIdParam } = await params
  const candidateId = Number(candidateIdParam)
  const detail = await getCandidateDetail(candidateId)

  if (!detail) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}
