import { NextRequest, NextResponse } from 'next/server'
import { getCandidates, type CandidateStatusFilter } from '@/lib/candidates'

/**
 * TypeScript/Next.js concept: this file is a "Route Handler". Because it
 * lives at app/api/events/[eventId]/candidates/route.ts, Next.js
 * automatically wires it up to serve GET requests at:
 *
 *     /api/events/123/candidates?status=pending&search=ines&cursor=45
 *
 * The `[eventId]` folder name is a "dynamic segment" — whatever number is
 * in the URL there becomes available as `params.eventId` below.
 *
 * This is what the browser (our client component) calls with `fetch()`
 * every time you type in the search box or click "Show more".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventIdParam } = await params
  const eventId = Number(eventIdParam)

  // `request.url` includes everything after the `?` — searchParams reads
  // those query-string values.
  const { searchParams } = new URL(request.url)

  const status = (searchParams.get('status') ?? 'pending') as CandidateStatusFilter
  const search = searchParams.get('search') ?? undefined
  const cursorParam = searchParams.get('cursor')
  const cursor = cursorParam ? Number(cursorParam) : null

  const page = await getCandidates({ eventId, status, search, cursor })

  return NextResponse.json(page)
}
