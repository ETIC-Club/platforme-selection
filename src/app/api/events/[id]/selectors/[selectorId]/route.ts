import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// PATCH /api/events/[id]/selectors/[selectorId]
//   — Update a selector (e.g. change selectorType)
//
// Body: { selectorType?: "RH" | "Technique" }
//
// Business rule: cannot modify selectors of a closed event.
// ────────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/events/[id]/selectors/[selectorId]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const params = await ctx.params;
  const eventId = Number(params.id);
  const selectorId = Number(params.selectorId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }
  if (!Number.isInteger(selectorId) || selectorId <= 0) {
    return NextResponse.json(
      { error: "Invalid selector id" },
      { status: 400 },
    );
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

  const validTypes = ["RH", "Technique"];
  if (
    data.selectorType !== undefined &&
    !validTypes.includes(data.selectorType as string)
  ) {
    errors.push('selectorType must be "RH" or "Technique"');
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    errors.push("isActive must be a boolean");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  try {
    // Verify event exists and is open
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "termine") {
      return NextResponse.json(
        { error: "Cannot modify selectors of a closed event" },
        { status: 400 },
      );
    }

    // Find the selector (must belong to this event)
    const existing = await prisma.eventSelector.findFirst({
      where: { id: selectorId, eventId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Selector not found for this event" },
        { status: 404 },
      );
    }

    // If changing selectorType, check for duplicates on the new combo
    if (
      data.selectorType !== undefined &&
      data.selectorType !== existing.selectorType
    ) {
      const duplicate = await prisma.eventSelector.findUnique({
        where: {
          eventId_userId_selectorType: {
            eventId,
            userId: existing.userId,
            selectorType: data.selectorType as "RH" | "Technique",
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error: `This user already has a ${data.selectorType} selector for this event`,
          },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.selectorType !== undefined)
      updateData.selectorType = data.selectorType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const selector = await prisma.eventSelector.update({
      where: { id: selectorId },
      data: updateData,
      include: { user: true },
    });

    return NextResponse.json({ selector });
  } catch (err: unknown) {
    console.error(
      `PATCH /api/events/${eventId}/selectors/${selectorId} failed:`,
      err,
    );
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ────────────────────────────────────────────────────────────────
// DELETE /api/events/[id]/selectors/[selectorId]
//   — Deactivate a selector, or permanently delete an inactive selector
//     when called with ?permanent=true
//
// Business rule: cannot modify selectors of a closed event.
// ────────────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/events/[id]/selectors/[selectorId]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const params = await ctx.params;
  const eventId = Number(params.id);
  const selectorId = Number(params.selectorId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }
  if (!Number.isInteger(selectorId) || selectorId <= 0) {
    return NextResponse.json(
      { error: "Invalid selector id" },
      { status: 400 },
    );
  }

  try {
    // Verify event exists and is open
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.status === "termine") {
      return NextResponse.json(
        { error: "Cannot modify selectors of a closed event" },
        { status: 400 },
      );
    }

    // Find the selector (must belong to this event)
    const existing = await prisma.eventSelector.findFirst({
      where: { id: selectorId, eventId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Selector not found for this event" },
        { status: 404 },
      );
    }

    // Directly remove selector from the event
    await prisma.eventSelector.delete({ where: { id: selectorId } });

    return NextResponse.json({
      message: "Selector removed from event successfully",
    });
  } catch (err: unknown) {
    console.error(
      `DELETE /api/events/${eventId}/selectors/${selectorId} failed:`,
      err,
    );
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
