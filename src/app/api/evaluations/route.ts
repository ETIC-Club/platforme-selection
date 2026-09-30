import { NextRequest, NextResponse } from "next/server";
import { submitCandidateEvaluation } from "@/services/candidateService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, selectorName, selectorType, decision, comment, userRole } = body;

    if (userRole === "STANDARD_USER") {
      return NextResponse.json(
        { error: "Action non autorisée: les utilisateurs standard sont en lecture seule." },
        { status: 403 }
      );
    }

    if (!candidateId || !decision) {
      return NextResponse.json(
        { error: "Candidate ID and decision are required." },
        { status: 400 }
      );
    }

    const result = await submitCandidateEvaluation({
      candidateId: Number(candidateId),
      selectorName: selectorName || "Sélecteur",
      selectorType: selectorType || "Technique",
      decision,
      comment: comment || "",
      userRole,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
