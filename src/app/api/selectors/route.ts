import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SelectorViewModel, SelectorsApiResponse } from "@/lib/types";

// ────────────────────────────────────────────────────────────────
// GET /api/selectors?status=all|done|in_progress&search=...
//                   &page=1&limit=10&eventId=1
//
// Returns all active EventSelectors across all events (or filtered
// by eventId) with their progress metrics.
//
// "Status" is computed server-side:
//   - "termine": the selector has evaluated ALL assigned candidates
//   - "en_cours": the selector has at least one un-evaluated assignment
//
// The progress is: (evaluated assignments) / (total assignments).
// ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database connection unavailable" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") ?? "all";
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
  const eventIdParam = searchParams.get("eventId");

  try {
    // Build the where clause for EventSelector
    const whereClause: Record<string, unknown> = { isActive: true };
    if (eventIdParam) {
      const eid = Number(eventIdParam);
      if (Number.isInteger(eid) && eid > 0) {
        whereClause.eventId = eid;
      }
    }

    // Fetch all active selectors with their assignments and evaluations
    const rawSelectors = await prisma.eventSelector.findMany({
      where: whereClause,
      include: {
        user: true,
        assignments: {
          include: {
            evaluation: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    // Transform to view models
    let selectors: SelectorViewModel[] = rawSelectors.map((es) => {
      const totalAssignments = es.assignments.length;
      const evaluatedCount = es.assignments.filter(
        (a) => a.evaluation && a.evaluation.decision !== null,
      ).length;

      const progressPercent =
        totalAssignments > 0
          ? Math.round((evaluatedCount / totalAssignments) * 100)
          : 0;

      // A selector is "terminé" only if they have assignments AND
      // all of them are evaluated
      const status: "termine" | "en_cours" =
        totalAssignments > 0 && evaluatedCount === totalAssignments
          ? "termine"
          : "en_cours";

      return {
        id: es.id,
        name: es.user.fullName ?? es.user.email,
        email: es.user.email,
        roleType: es.selectorType as "RH" | "Technique",
        selected: evaluatedCount,
        total: totalAssignments,
        progressPercent,
        status,
      };
    });

    // ── Apply status filter ────────────────────────────────────
    if (statusFilter === "done") {
      selectors = selectors.filter((s) => s.status === "termine");
    } else if (statusFilter === "in_progress") {
      selectors = selectors.filter((s) => s.status === "en_cours");
    }

    // ── Apply search filter ────────────────────────────────────
    if (search) {
      selectors = selectors.filter((s) => {
        const name = s.name.toLowerCase();
        const email = s.email.toLowerCase();
        const role = s.roleType.toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          role.includes(search)
        );
      });
    }

    // ── Pagination ─────────────────────────────────────────────
    const total = selectors.length;
    const offset = (page - 1) * limit;
    const paginated = selectors.slice(offset, offset + limit);

    const response: SelectorsApiResponse = {
      selectors: paginated,
      total,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("GET /api/selectors failed:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
