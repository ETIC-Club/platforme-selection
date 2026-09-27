import { NextRequest, NextResponse } from "next/server";
import { getSelectorsForEvent } from "@/services/dataService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const selectors = await getSelectorsForEvent(eventId);
    
    let eventName = `Event #${eventId}`;
    try {
      const { prisma } = await import("@/lib/prisma");
      if (prisma) {
        const ev = await prisma.event.findUnique({
          where: { id: eventId },
          select: { name: true },
        });
        if (ev?.name) eventName = ev.name;
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ selectors, eventName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
