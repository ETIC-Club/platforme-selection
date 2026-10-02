import { NextResponse } from "next/server";
import { prisma, resetPrismaClient } from "@/lib/prisma";

function getPrisma(): any {
  if (prisma && (prisma as any).eventComment) {
    return prisma;
  }
  try {
    const refreshed = resetPrismaClient();
    if (refreshed && (refreshed as any).eventComment) {
      return refreshed;
    }
  } catch (err) {
    console.warn("resetPrismaClient warning:", err);
  }
  return prisma;
}

async function getCommentsViaSql(eventId: number) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT 
       ec.id,
       ec.event_id AS "eventId",
       ec.user_id AS "userId",
       ec.comment,
       ec.created_at AS "createdAt",
       u.id AS "user_id",
       u.full_name AS "user_fullName",
       u.email AS "user_email"
     FROM "event_comments" ec
     LEFT JOIN "users" u ON ec.user_id = u.id
     WHERE ec.event_id = $1
     ORDER BY ec.created_at DESC`,
    eventId
  );

  return rows.map((r: any) => ({
    id: r.id,
    eventId: r.eventId,
    userId: r.userId,
    comment: r.comment,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt || new Date().toISOString()),
    user: r.user_id
      ? {
          id: r.user_id,
          fullName: r.user_fullName,
          email: r.user_email,
        }
      : null,
  }));
}

async function createCommentViaSql(
  eventId: number,
  comment: string,
  authorUserId?: number
) {
  let rows: any[];
  if (authorUserId) {
    rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "event_comments" ("event_id", "user_id", "comment", "created_at")
       VALUES ($1, $2, $3, NOW())
       RETURNING id, event_id AS "eventId", user_id AS "userId", comment, created_at AS "createdAt"`,
      eventId,
      authorUserId,
      comment
    );
  } else {
    rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO "event_comments" ("event_id", "comment", "created_at")
       VALUES ($1, $2, NOW())
       RETURNING id, event_id AS "eventId", user_id AS "userId", comment, created_at AS "createdAt"`,
      eventId,
      comment
    );
  }

  const row = rows[0];
  let authorUser = null;
  if (row.userId) {
    try {
      authorUser = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { id: true, fullName: true, email: true },
      });
    } catch {
      authorUser = null;
    }
  }

  return {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    comment: row.comment,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt || new Date().toISOString()),
    user: authorUser,
  };
}

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

    const client = getPrisma();
    if (client && typeof client.eventComment?.findMany === "function") {
      try {
        const comments = await client.eventComment.findMany({
          where: { eventId },
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(comments);
      } catch (err) {
        console.warn("Delegate findMany failed, falling back to SQL:", err);
      }
    }

    const comments = await getCommentsViaSql(eventId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/event-comments error:", error);
    return NextResponse.json([]);
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
      typeof body.comment === "string" ? body.comment.trim() : "";

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

    // Optional user attribution
    let authorUserId: number | undefined = undefined;
    if (typeof body.userId === "number" && !isNaN(body.userId) && body.userId > 0) {
      const dbUser = await prisma.user.findUnique({
        where: { id: body.userId },
      });
      if (dbUser) {
        authorUserId = dbUser.id;
      }
    } else if (typeof body.userEmail === "string" && body.userEmail.trim()) {
      const dbUser = await prisma.user.findUnique({
        where: { email: body.userEmail.trim() },
      });
      if (dbUser) {
        authorUserId = dbUser.id;
      }
    }

    const client = getPrisma();
    if (client && typeof client.eventComment?.create === "function") {
      try {
        const newComment = await client.eventComment.create({
          data: {
            eventId,
            comment,
            ...(authorUserId ? { userId: authorUserId } : {}),
          },
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        });

        return NextResponse.json(
          {
            message: "Comment added successfully.",
            comment: newComment,
          },
          { status: 201 }
        );
      } catch (err) {
        console.warn("Delegate create failed, falling back to SQL:", err);
      }
    }

    // Direct SQL fallback
    const newComment = await createCommentViaSql(
      eventId,
      comment,
      authorUserId
    );

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
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to add event comment.",
      },
      { status: 500 }
    );
  }
}