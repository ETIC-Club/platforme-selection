import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCandidatesByEvent, CandidateDetail } from "@/services/candidateService";

// Helper function to escape CSV values according to RFC 4180
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const eventId = parseInt(id, 10);
    if (isNaN(eventId) || eventId <= 0) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    let eventName = `Event #${eventId}`;
    const closedAt = new Date();

    // 1. Mark event as closed ('termine') in DB if prisma is connected
    if (prisma) {
      try {
        const updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: {
            status: "termine",
            closedAt: closedAt,
          },
          select: { id: true, name: true, status: true, closedAt: true },
        });
        if (updatedEvent?.name) {
          eventName = updatedEvent.name;
        }
      } catch (dbErr) {
        console.warn(`Prisma update warning for event ${eventId}:`, dbErr);
      }
    }

    // 2. Fetch all candidates for this event
    const allCandidates: CandidateDetail[] = await getCandidatesByEvent(eventId);

    // 3. Filter strictly accepted candidates only
    // Exclude pending ('en_attente') and rejected ('refuse') candidates
    // No fallback to all candidates: only candidates who are accepted are exported
    const acceptedCandidates = allCandidates.filter(
      (c) => c.finalStatus === "accepte"
    );

    const candidatesToExport = acceptedCandidates;

    // 4. Construct CSV rows with all important fields
    const headers = [
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Statut Final",
      "Filière / Niveau",
      "Compétences",
      "Réponse Technique / Bio",
      "Évaluations & Commentaires",
      "Événement",
      "Date de Clôture",
    ];

    const rows = candidatesToExport.map((c) => {
      const evaluationsSummary = c.evaluations
        .map(
          (e) =>
            `[${e.selectorType} - ${e.selectorName}: ${e.decision.toUpperCase()}${
              e.comment ? ` - "${e.comment}"` : ""
            }]`
        )
        .join(" | ");

      const competencesStr = Array.isArray(c.competences)
        ? c.competences.join(", ")
        : "";

      return [
        escapeCsv(c.prenom || ""),
        escapeCsv(c.nom || ""),
        escapeCsv(c.email || ""),
        escapeCsv(c.telephone || ""),
        escapeCsv(
          c.finalStatus === "accepte"
            ? "Accepté"
            : c.finalStatus === "refuse"
            ? "Refusé"
            : "En attente"
        ),
        escapeCsv(c.education || ""),
        escapeCsv(competencesStr),
        escapeCsv(c.bio || ""),
        escapeCsv(evaluationsSummary),
        escapeCsv(eventName),
        escapeCsv(closedAt.toISOString().split("T")[0]),
      ].join(",");
    });

    // UTF-8 BOM (\uFEFF) ensures Microsoft Excel and Google Sheets correctly display French accented characters
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    const sanitizedEventName = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fileName = `candidats_acceptes_${sanitizedEventName}_${
      closedAt.toISOString().split("T")[0]
    }.csv`;

    // Check if client requested direct attachment download
    const isDirectDownload = request.nextUrl.searchParams.get("download") === "true";
    if (isDirectDownload) {
      return new Response(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventName,
      acceptedCount: acceptedCandidates.length,
      totalExported: candidatesToExport.length,
      closedAt: closedAt.toISOString(),
      fileName,
      csvContent,
    });
  } catch (err: unknown) {
    console.error("POST /api/events/[id]/close failed:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
