import { NextRequest, NextResponse } from 'next/server'
import { setCandidateDecision } from '@/lib/candidates'

/**
 * PATCH /api/candidates/42/decision   body: { "status": "accepted" }
 *
 * This is what fires when the admin picks something from the
 * "Select decision" dropdown on the "To be reviewed" page.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId: candidateIdParam } = await params
  const candidateId = Number(candidateIdParam)
  const body = await request.json()
  const status = body.status

  if (status !== 'accepted' && status !== 'refused' && status !== 'pending' && status !== 'none') {
    return NextResponse.json(
      { error: 'status must be "accepted", "refused", "pending", or "none"' },
      { status: 400 }
    )
  }

  const updated = await setCandidateDecision(candidateId, status)
  return NextResponse.json(updated)
}
