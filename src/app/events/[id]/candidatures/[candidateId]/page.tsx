import { notFound } from 'next/navigation'
import { getCandidateDetail } from '@/lib/candidate-detail'
import { CandidateProfile } from '@/components/candidates/CandidateProfile'

interface PageProps {
  params: Promise<{
    id: string
    candidateId: string
  }>
}

export default async function CandidatePage({ params }: PageProps) {
  const resolvedParams = await params
  const candidateId = parseInt(resolvedParams.candidateId, 10)

  if (isNaN(candidateId)) {
    notFound()
  }

  const candidate = await getCandidateDetail(candidateId)

  if (!candidate) {
    notFound()
  }

  return (
    <CandidateProfile candidate={candidate} eventId={parseInt(resolvedParams.id, 10)} />
  )
}
