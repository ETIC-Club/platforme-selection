import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────
// GET /api/selectors/[id] — Get a single selector's detail
//
// Returns the selector's info plus their assigned candidates
// with evaluation status, used by the /selectors/[id] page.
// ────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
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
    return NextResponse.json(
      { error: "Invalid selector id" },
      { status: 400 },
    );
  }

  try {
    const eventSelector = await prisma.eventSelector.findUnique({
      where: { id },
      include: {
        user: true,
        assignments: {
          include: {
            evaluation: true,
            candidate: true,
          },
        },
      },
    });

    if (!eventSelector) {
      return NextResponse.json(
        { error: "Sélecteur introuvable" },
        { status: 404 },
      );
    }

    const totalAssignments = eventSelector.assignments.length;
    const evaluatedCount = eventSelector.assignments.filter(
      (a) => a.evaluation && a.evaluation.decision !== null,
    ).length;

    const progressPercent =
      totalAssignments > 0
        ? Math.round((evaluatedCount / totalAssignments) * 100)
        : 0;

    const status =
      totalAssignments > 0 && evaluatedCount === totalAssignments
        ? "termine"
        : "en_cours";

    const assignments = eventSelector.assignments.map((a) => ({
      id: a.id,
      candidateName: `${a.candidate.prenom ?? ""} ${a.candidate.nom ?? ""}`.trim() || "Candidat",
      candidateEmail: a.candidate.email ?? "",
      decision: a.evaluation?.decision ?? null,
      evaluatedAt: a.evaluation?.evaluatedAt?.toISOString() ?? null,
    }));

    const selector = {
      id: eventSelector.id,
      name: eventSelector.user.fullName ?? eventSelector.user.email,
      email: eventSelector.user.email,
      roleType: eventSelector.selectorType,
      selected: evaluatedCount,
      total: totalAssignments,
      progressPercent,
      status,
      assignments,
    };

    return NextResponse.json({ selector });
  } catch (err: unknown) {
    console.error(`GET /api/selectors/${id} failed:`, err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
