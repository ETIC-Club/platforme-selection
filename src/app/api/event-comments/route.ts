import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = Number(searchParams.get("eventId"));

    if (!eventId) {
      return NextResponse.json(
        { error: "Event id is required." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    if (event.status !== "termine") {
      return NextResponse.json(
        { error: "Comments are only available for past events." },
        { status: 400 }
      );
    }

    const comments = await prisma.eventComment.findMany({
      where: {
        eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/event-comments error:", error);

    return NextResponse.json(
      { error: "Unable to load event comments." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const eventId = Number(body.eventId);
    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (!eventId) {
      return NextResponse.json(
        { error: "Event id is required." },
        { status: 400 }
      );
    }

    if (!comment) {
      return NextResponse.json(
        { error: "Comment cannot be empty." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    if (event.status !== "termine") {
      return NextResponse.json(
        { error: "Comments are only available for past events." },
        { status: 400 }
      );
    }

    const newComment = await prisma.eventComment.create({
      data: {
        eventId,
        comment,
      },
    });

    return NextResponse.json(
      {
        message: "Comment added successfully.",
        comment: newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/event-comments error:", error);

    return NextResponse.json(
      { error: "Unable to add event comment." },
      { status: 500 }
    );
  }
}