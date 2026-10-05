import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// GET /api/events/[id]  — Fetch a single event with its selectors
// ────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/events/[id]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { selectors: { include: { user: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err: unknown) {
    console.error(`GET /api/events/${id} failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ────────────────────────────────────────────────────────────────
// PATCH /api/events/[id]  — Update an event (including closing)
//
// Closing: send { "status": "termine" } to close.
//   - Sets closedAt = now().
//   - A closed event cannot be re-opened (rejected with 400).
//
// ⚠️ TEMPORARY: createdBy stays as-is; no session to validate
//   ownership. When auth is wired, add an authorization check.
// ────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/events/[id]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
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

  // Reject server-managed fields
  const forbiddenFields = ["id", "createdAt", "closedAt", "createdBy"];
  for (const field of forbiddenFields) {
    if (data[field] !== undefined) {
      errors.push(`${field} must not be sent by the client`);
    }
  }

  // Validate fields if present
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.push("name must be a non-empty string");
    }
  }
  if (data.quotaParticipants !== undefined) {
    if (!Number.isInteger(data.quotaParticipants)) {
      errors.push("quotaParticipants must be an integer");
    }
  }
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
  if (
    data.status !== undefined &&
    data.status !== "en_cours" &&
    data.status !== "termine"
  ) {
    errors.push('status must be "en_cours" or "termine"');
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  try {
    // Check the event exists and its current status
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prevent modifications on a closed event (except this is the close itself)
    if (existing.status === "termine") {
      return NextResponse.json(
        { error: "Cannot modify a closed event" },
        { status: 400 },
      );
    }

    // Build the update payload
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = (data.name as string).trim();
    if (data.quotaParticipants !== undefined)
      updateData.quotaParticipants = data.quotaParticipants;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.googleSheetUrl !== undefined)
      updateData.googleSheetUrl = data.googleSheetUrl;
    if (data.nbEvalRh !== undefined) updateData.nbEvalRh = data.nbEvalRh;
    if (data.nbEvalTechnique !== undefined)
      updateData.nbEvalTechnique = data.nbEvalTechnique;

    // Handle closing
    if (data.status === "termine") {
      updateData.status = "termine";
      updateData.closedAt = new Date();
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ event });
  } catch (err: unknown) {
    console.error(`PATCH /api/events/${id} failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ────────────────────────────────────────────────────────────────
// DELETE /api/events/[id]  — Delete an event (cascades via schema)
// ────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/events/[id]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Event deleted" });
  } catch (err: unknown) {
    console.error(`DELETE /api/events/${id} failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
