import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE } from "@/lib/session";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  const { credential } = await request.json();
  if (!credential) {
    return NextResponse.json({ error: "Missing credential" }, { status: 400 });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }

  if (!payload?.sub || !payload.email) {
    return NextResponse.json({ error: "Incomplete Google profile" }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const email = payload.email.toLowerCase().trim();
  const googleId = payload.sub;

  // 1. Verify user is authorized in the database (created by an admin or seeded)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Compte non autorisé. Contactez un administrateur." },
      { status: 403 }
    );
  }

  // 2. Prevent conflict if this Google ID is already bound to a DIFFERENT user account
  const conflictingUser = await prisma.user.findUnique({
    where: { googleId },
  });

  if (conflictingUser && conflictingUser.id !== existingUser.id) {
    return NextResponse.json(
      { error: "Ce compte Google est déjà lié à un autre compte utilisateur." },
      { status: 409 }
    );
  }

  // 3. Link Google credential on first connection or update last login
  // (Replaces placeholder/null googleId with the verified Google sub, preserving DB roles)
  const user = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      googleId,
      lastLoginAt: new Date(),
      fullName: existingUser.fullName || payload.name || null,
    },
  });

  const token = await signSession({
    userId: user.id,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
  });

  const response = NextResponse.json({ ok: true, isSuperAdmin: user.isSuperAdmin });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}