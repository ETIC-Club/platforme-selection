import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveEvents } from "@/services/dataService";

/**
 * GET /api/events
 *
 * Two modes controlled by the `all` query parameter:
 *   - Default (no param):  returns the dashboard view-model via getActiveEvents()
 *     (active events only, with category/dateSubtitle/gradientIndex).
 *     This is what the existing dashboard page.tsx consumes.
 *   - ?all=true:           returns ALL events (active + closed) as raw Prisma
 *     objects with their selectors. This is the CRUD "list all" endpoint.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wantAll = searchParams.get("all") === "true";

  // --- CRUD mode: raw list of all events ---
  if (wantAll) {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 500 },
      );
    }

    try {
      const events = await prisma.event.findMany({
        include: { selectors: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ events });
    } catch (err: unknown) {
      console.error("GET /api/events?all=true failed:", err);
      const message =
        err instanceof Error ? err.message : "Internal Server Error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // --- Dashboard mode: view-model for the UI ---
  try {
    const events = await getActiveEvents();
    return NextResponse.json({ events });
  } catch (err: unknown) {
    console.error("GET /api/events failed:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/events
 * Creates a new event.
 *
 * Required body fields: name (string), quotaParticipants (integer).
 * Optional: description, googleSheetUrl, nbEvalRh, nbEvalTechnique.
 * Server-set: id, status (en_cours), createdAt (now), closedAt (null).
 *
 * ⚠️ TEMPORARY: createdBy is set to null because there is no real session
 * wired yet. The schema allows `createdBy Int?` so this is safe.
 * When auth is ready, extract the user id from the session and pass it here.
 */
export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  // --- Parse JSON body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 },
    );
  }

  const data = body as Record<string, unknown>;

  // --- Validate required fields ---
  const errors: string[] = [];

  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    errors.push("name is required and must be a non-empty string");
  }

  if (
    data.quotaParticipants === undefined ||
    data.quotaParticipants === null ||
    !Number.isInteger(data.quotaParticipants)
  ) {
    errors.push("quotaParticipants is required and must be an integer");
  }

  // --- Validate optional fields ---
  if (data.description !== undefined && typeof data.description !== "string") {
    errors.push("description must be a string");
  }

  if (
    data.googleSheetUrl !== undefined &&
    typeof data.googleSheetUrl !== "string"
  ) {
    errors.push("googleSheetUrl must be a string");
  }

  if (data.nbEvalRh !== undefined) {
    if (!Number.isInteger(data.nbEvalRh)) {
      errors.push("nbEvalRh must be an integer");
    } else if ((data.nbEvalRh as number) < 0) {
      errors.push("nbEvalRh must not be negative");
    }
  }

  if (data.nbEvalTechnique !== undefined) {
    if (!Number.isInteger(data.nbEvalTechnique)) {
      errors.push("nbEvalTechnique must be an integer");
    } else if ((data.nbEvalTechnique as number) < 0) {
      errors.push("nbEvalTechnique must not be negative");
    }
  }

  // Reject server-managed fields if client sends them
  const forbiddenFields = ["id", "status", "createdAt", "closedAt", "createdBy"];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`${field} must not be sent by the client`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  // --- Create event ---
  try {
    const event = await prisma.event.create({
      data: {
        name: (data.name as string).trim(),
        quotaParticipants: data.quotaParticipants as number,
        description: (data.description as string | undefined) ?? null,
        googleSheetUrl: (data.googleSheetUrl as string | undefined) ?? null,
        nbEvalRh: (data.nbEvalRh as number | undefined) ?? 0,
        nbEvalTechnique: (data.nbEvalTechnique as number | undefined) ?? 0,
        // ⚠️ TEMPORARY: no session → createdBy = null
        createdBy: null,
      },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/events failed:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
