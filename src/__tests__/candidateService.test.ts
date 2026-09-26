import { describe, it, expect } from "vitest";
import {
  getCandidatesByEvent,
  submitCandidateEvaluation,
} from "@/services/candidateService";

describe("Candidate Service", () => {
  it("fetches candidates for an event", async () => {
    const candidates = await getCandidatesByEvent(1);
    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);

    const first = candidates[0];
    expect(first).toHaveProperty("nom");
    expect(first).toHaveProperty("prenom");
    expect(first).toHaveProperty("competences");
    expect(first).toHaveProperty("projets");
    expect(first).toHaveProperty("evaluations");
  });

  it("successfully evaluates a candidate and updates status and timestamp", async () => {
    const testComment = "Très bon profil, maîtrise technique avérée.";
    const result = await submitCandidateEvaluation({
      candidateId: 1,
      selectorName: "Amira Test",
      selectorType: "Technique",
      decision: "accepter",
      comment: testComment,
    });

    expect(result.success).toBe(true);
    expect(result.candidate.finalStatus).toBe("accepte");

    const latestEval = result.candidate.evaluations.find(
      (e) => e.selectorName === "Amira Test"
    );
    expect(latestEval).toBeDefined();
    expect(latestEval?.decision).toBe("accepter");
    expect(latestEval?.comment).toBe(testComment);
    expect(latestEval?.evaluatedAt).toBeDefined();
  });

  it("throws an error when candidate does not exist", async () => {
    await expect(
      submitCandidateEvaluation({
        candidateId: 99999,
        selectorName: "Test",
        selectorType: "RH",
        decision: "rejeter",
        comment: "N/A",
      })
    ).rejects.toThrow("Candidate not found");
  });

  it("rejects evaluation submission from STANDARD_USER", async () => {
    await expect(
      submitCandidateEvaluation({
        candidateId: 1,
        selectorName: "Member User",
        selectorType: "RH",
        decision: "accepter",
        comment: "Test unauthorized",
        userRole: "STANDARD_USER",
      })
    ).rejects.toThrow("Action non autorisée: les utilisateurs standard sont en lecture seule.");
  });
});
