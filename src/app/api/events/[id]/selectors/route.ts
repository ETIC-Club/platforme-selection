import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// GET /api/events/[id]/selectors  — List selectors for an event
// ────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/events/[id]/selectors">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { id: rawId } = await ctx.params;
  const eventId = Number(rawId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const selectors = await prisma.eventSelector.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ selectors });
  } catch (err: unknown) {
    console.error(`GET /api/events/${rawId}/selectors failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ────────────────────────────────────────────────────────────────
// POST /api/events/[id]/selectors  — Add a selector to an event
//
// Body: { email: string, selectorType: "RH" | "Technique" }
//
// The user is looked up by email. If not found → 404 (the user must
// exist in the users table first).
//
// Business rules:
//   - Duplicate (eventId + userId + selectorType) → 409
//   - Closed event → 400
//
// ⚠️ TEMPORARY: addedBy is null — no session wired yet.
// ────────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/events/[id]/selectors">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { id: rawId } = await ctx.params;
  const eventId = Number(rawId);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  // Parse body
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
  const errors: string[] = [];

  if (typeof data.email !== "string" || data.email.trim().length === 0) {
    errors.push("email is required and must be a non-empty string");
  }

  const validTypes = ["RH", "Technique"];
  if (!validTypes.includes(data.selectorType as string)) {
    errors.push('selectorType is required and must be "RH" or "Technique"');
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const email = (data.email as string).trim();
  const selectorType = data.selectorType as "RH" | "Technique";

  try {
    // Verify event exists and is open
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "termine") {
      return NextResponse.json(
        { error: "Cannot add selectors to a closed event" },
        { status: 400 },
      );
    }

    // Look up user by email — auto-create if not found
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const fullName = typeof data.fullName === "string" ? data.fullName.trim() : null;
      user = await prisma.user.create({
        data: {
          email,
          googleId: `manual_${email}`,
          fullName,
          isSuperAdmin: false,
        },
      });
    }

    // Check for duplicate
    const existing = await prisma.eventSelector.findUnique({
      where: {
        eventId_userId_selectorType: {
          eventId,
          userId: user.id,
          selectorType,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `User "${email}" is already a ${selectorType} selector for this event`,
        },
        { status: 409 },
      );
    }

    const selector = await prisma.eventSelector.create({
      data: {
        eventId,
        userId: user.id,
        selectorType,
        // ⚠️ TEMPORARY: addedBy = null (no session)
        addedBy: null,
      },
      include: { user: true },
    });

    return NextResponse.json({ selector }, { status: 201 });
  } catch (err: unknown) {
    console.error(`POST /api/events/${eventId}/selectors failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
