import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (!prisma) {
      return NextResponse.json({
        event: {
          id: eventId,
          name: "TRAINING CAMP XIII",
          description: "Hackathon et camp de sélection annuel des membres du Club ETIC",
          quotaParticipants: 60,
          status: "en_cours",
          candidates: [],
          selectors: [],
        },
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        candidates: true,
        selectors: {
          include: {
            user: true,
            assignments: {
              include: { evaluation: true },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
