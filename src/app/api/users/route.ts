import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// GET /api/users — List all users
// Query params: search (optional), page (default 1), limit (default 20)
// ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          isSuperAdmin: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { eventSelectors: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (err: unknown) {
    console.error("GET /api/users failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// POST /api/users — Create a new user
// Body: { email, fullName?, isSuperAdmin? }
// ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
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
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const fullName = typeof data.fullName === "string" ? data.fullName.trim() : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Un email valide est requis." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: `Un utilisateur avec l'email "${email}" existe déjà.` },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        googleId: `manual_${email}`,
        fullName: fullName || null,
        isSuperAdmin: data.isSuperAdmin === true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/users failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
