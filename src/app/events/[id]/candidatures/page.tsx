"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CandidateStoriesModal } from "@/components/CandidateStoriesModal";
import { ArrowLeftIcon } from "@/components/Icons";
import { CandidateDetail } from "@/services/candidateService";
import styles from "@/components/dashboard.module.css";

interface CandidaturesPageProps {
  params: Promise<{ id: string }>;
}

type FilterType = "all" | "to_review" | "accepte" | "refuse";

export default function CandidaturesPage({ params }: CandidaturesPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  const [candidates, setCandidates] = useState<CandidateDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCandidates() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}/candidates`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.candidates) {
            setCandidates(data.candidates);
          }
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCandidates();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleEvaluate = async (
    candidateId: number,
    data: {
      decision: "accepter" | "rejeter" | "en_attente";
      comment: string;
      selectorType: "RH" | "Technique";
      selectorName: string;
      userRole?: string;
    }
  ) => {
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId,
        decision: data.decision,
        comment: data.comment,
        selectorType: data.selectorType,
        selectorName: data.selectorName,
        userRole: data.userRole,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Erreur lors de l'enregistrement de l'évaluation");
    }

    const result = await res.json();
    if (result.candidate) {
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? result.candidate : c))
      );
      setSelectedCandidate(result.candidate);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const allCount = candidates.length;
  const toReviewCount = candidates.filter((c) => c.finalStatus === "en_attente").length;
  const acceptedCount = candidates.filter((c) => c.finalStatus === "accepte").length;
  const rejectedCount = candidates.filter((c) => c.finalStatus === "refuse").length;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
      {({ searchQuery, role }) => {
        const currentSelectorType = role === "SELECTOR_RH" ? "RH" : "Technique";
        const currentSelectorName =
          role === "SUPER_ADMIN"
            ? "Super Admin"
            : role === "SELECTOR_RH"
            ? "Sélecteur RH"
            : "Sélecteur Tech";

        const filteredCandidates = candidates.filter((cand) => {
          if (filter === "to_review" && cand.finalStatus !== "en_attente") return false;
          if (filter === "accepte" && cand.finalStatus !== "accepte") return false;
          if (filter === "refuse" && cand.finalStatus !== "refuse") return false;

          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const fullName = `${cand.prenom} ${cand.nom}`.toLowerCase();
            const email = cand.email.toLowerCase();
            const education = cand.education.toLowerCase();
            const skills = cand.competences.join(" ").toLowerCase();
            return (
              fullName.includes(q) ||
              email.includes(q) ||
              education.includes(q) ||
              skills.includes(q)
            );
          }
          return true;
        });

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Link
                    href={`/events/${eventId}`}
                    className={styles.backLink}
                    style={{ fontSize: "14px" }}
                  >
                    <ArrowLeftIcon />
                    <span>Retour à l&apos;événement</span>
                  </Link>
                </div>
                <h1 className={styles.pageTitle} style={{ marginTop: "6px" }}>
                  Candidatures (Event #{eventId})
                </h1>
                <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                  Consultez les stories des candidats et soumettez vos évaluations.
                </p>
              </div>

              <div className={styles.filterPillsRow}>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`${styles.filterPill} ${filter === "all" ? styles.filterPillActive : ""}`}
                >
                  Tous ({allCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("to_review")}
                  className={`${styles.filterPill} ${filter === "to_review" ? styles.filterPillActive : ""}`}
                >
                  À traiter ({toReviewCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("accepte")}
                  className={`${styles.filterPill} ${filter === "accepte" ? styles.filterPillActive : ""}`}
                >
                  Acceptés ({acceptedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("refuse")}
                  className={`${styles.filterPill} ${filter === "refuse" ? styles.filterPillActive : ""}`}
                >
                  Rejetés ({rejectedCount})
                </button>
              </div>
            </div>

            <div className={styles.eventsList}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                  <p style={{ fontSize: "15px", fontWeight: "600" }}>Chargement des candidatures...</p>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>Aucun candidat trouvé</p>
                  <p style={{ fontSize: "13px", marginTop: "6px" }}>
                    Aucune candidature ne correspond à ce filtre ou critère de recherche.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.candidatureHeaderRow}>
                    <span>CANDIDAT</span>
                    <span>FORMATION</span>
                    <span>STATUT</span>
                    <span>DERNIER TRAITEMENT</span>
                    <span style={{ textAlign: "right" }}>ACTION</span>
                  </div>

                  {filteredCandidates.map((cand) => {
                    const initials = `${cand.prenom?.[0] || ""}${cand.nom?.[0] || ""}`.toUpperCase();
                    const latestEvaluation =
                      cand.evaluations.length > 0
                        ? cand.evaluations[cand.evaluations.length - 1]
                        : null;

                    return (
                      <article key={cand.id} className={styles.candidatureCard}>
                        <div className={styles.candProfile}>
                          <div className={styles.candAvatar}>{initials}</div>
                          <div className={styles.candNameGroup}>
                            <span className={styles.candName}>
                              {cand.prenom} {cand.nom}
                            </span>
                            <span className={styles.candEmail}>{cand.email}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: "13px", color: "#4B5563", fontWeight: "500" }}>
                          {cand.education}
                        </div>

                        <div>
                          {cand.finalStatus === "accepte" && (
                            <span className={styles.statusBadgeAccepte}>✓ Accepté</span>
                          )}
                          {cand.finalStatus === "refuse" && (
                            <span className={styles.statusBadgeRefuse}>✕ Rejeté</span>
                          )}
                          {cand.finalStatus === "en_attente" && (
                            <span className={styles.statusBadgeAttente}>⏳ En attente</span>
                          )}
                        </div>

                        <div>
                          {latestEvaluation ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: "#1F2937" }}>
                                {latestEvaluation.selectorName} ({latestEvaluation.selectorType})
                              </span>
                              <span style={{ fontSize: "11px", color: "#8C8F8E" }}>
                                {formatDate(latestEvaluation.evaluatedAt)}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>
                              Non traité
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            className={styles.viewStoryBtn}
                            aria-label={`Voir la story de ${cand.prenom} ${cand.nom}`}
                          >
                            <span>Voir Story</span>
                            <span>▶</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </>
              )}
            </div>

            {selectedCandidate && (
              <CandidateStoriesModal
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                onEvaluate={(candId, data) =>
                  handleEvaluate(candId, { ...data, userRole: role })
                }
                userRole={role}
                currentSelectorType={currentSelectorType}
                currentSelectorName={currentSelectorName}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}

