import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// DELETE /api/users/[userId] — Delete a user
// ────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[userId]">,
) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { userId: rawId } = await ctx.params;
  const userId = Number(rawId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé." },
        { status: 404 },
      );
    }

    // Delete related selectors first
    await prisma.eventSelector.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: "Utilisateur supprimé." });
  } catch (err: unknown) {
    console.error(`DELETE /api/users/${userId} failed:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
