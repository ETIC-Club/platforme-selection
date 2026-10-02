import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session || !session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      eventSelectors: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const isSuperAdmin = dbUser.isSuperAdmin;
  const selectorType = dbUser.selectorType ?? dbUser.eventSelectors[0]?.selectorType;

  let role: "SUPER_ADMIN" | "SELECTOR_RH" | "SELECTOR_TECHNIQUE" = "SELECTOR_TECHNIQUE";
  let roleTitle = "Sélecteur Dev";
  let roleSubtitle = "Évaluation technique & compétences";
  let badgeLabel = "Sélecteur Dev";

  if (isSuperAdmin) {
    role = "SUPER_ADMIN";
    roleTitle = "Admin";
    roleSubtitle = "Supervision globale & Gestion des événements";
    badgeLabel = "Admin";
  } else if (selectorType === "RH") {
    role = "SELECTOR_RH";
    roleTitle = "Sélecteur RH";
    roleSubtitle = "Évaluation des profils & soft skills";
    badgeLabel = "Sélecteur RH";
  }

  return NextResponse.json({
    user: {
      id: String(dbUser.id),
      name: dbUser.fullName || dbUser.email,
      email: dbUser.email,
      role,
      roleTitle,
      roleSubtitle,
      badgeLabel,
      isSuperAdmin,
    },
  });
}
