"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeftIcon } from "@/components/Icons";
import dashStyles from "@/components/dashboard.module.css";
import styles from "../selectors.module.css";

// ────────────────────────────────────────────────────────────────
// /selectors/[id] — Selector detail page
//
// Shows the selector's identity, role, progress stats, and their
// assigned candidates with evaluation status. This is the page
// the green arrow button on each card navigates to.
// ────────────────────────────────────────────────────────────────

interface SelectorDetailPageProps {
  params: Promise<{ id: string }>;
}

interface AssignmentItem {
  id: number;
  candidateName: string;
  candidateEmail: string;
  decision: string | null;
  evaluatedAt: string | null;
}

interface SelectorDetail {
  id: number;
  name: string;
  email: string;
  roleType: string;
  selected: number;
  total: number;
  progressPercent: number;
  status: string;
  assignments: AssignmentItem[];
}

export default function SelectorDetailPage({ params }: SelectorDetailPageProps) {
  const resolvedParams = use(params);
  const selectorId = parseInt(resolvedParams.id, 10);
  const isValidId = !isNaN(selectorId) && selectorId > 0;

  const [selector, setSelector] = useState<SelectorDetail | null>(null);
  const [loading, setLoading] = useState(isValidId);
  const [error, setError] = useState<string | null>(
    isValidId ? null : "ID de sélecteur invalide.",
  );

  useEffect(() => {
    if (!isValidId) return;

    let isMounted = true;

    async function loadSelector() {
      try {
        const res = await fetch(`/api/selectors/${selectorId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erreur ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setSelector(data.selector);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSelector();
    return () => {
      isMounted = false;
    };
  }, [selectorId, isValidId]);

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getDecisionLabel = (decision: string | null): string => {
    switch (decision) {
      case "accepter":
        return "✓ Accepté";
      case "rejeter":
        return "✕ Rejeté";
      case "en_attente":
        return "⏳ En attente";
      default:
        return "⏳ Non évalué";
    }
  };

  const getDecisionClass = (decision: string | null): string => {
    switch (decision) {
      case "accepter":
        return styles.decisionAccepter;
      case "rejeter":
        return styles.decisionRejeter;
      default:
        return styles.decisionEnAttente;
    }
  };

  return (
    <DashboardLayout>
      {() => (
        <div className={dashStyles.mainCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Chargement...</div>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <div className={styles.errorTitle}>{error}</div>
              <Link href="/selectors">
                <button
                  type="button"
                  className={styles.retryButton}
                  aria-label="Retour aux sélecteurs"
                >
                  ← Retour
                </button>
              </Link>
            </div>
          ) : selector ? (
            <>
              {/* Header with back link */}
              <div className={styles.detailHeader}>
                <Link href="/selectors" className={dashStyles.backLink}>
                  <ArrowLeftIcon />
                  <span>Retour aux sélecteurs</span>
                </Link>

                <div className={styles.detailMeta}>
                  <div className={styles.detailAvatar}>
                    {getInitials(selector.name)}
                  </div>
                  <div className={styles.detailInfo}>
                    <h1 className={styles.detailName}>{selector.name}</h1>
                    <span className={styles.detailEmail}>{selector.email}</span>
                    <span
                      className={`${styles.roleBadge} ${
                        selector.roleType === "RH"
                          ? styles.roleBadgeRH
                          : styles.roleBadgeTechnique
                      }`}
                      style={{ marginTop: "4px", width: "fit-content" }}
                    >
                      {selector.roleType === "RH" ? "RH" : "DEV"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className={styles.detailStatsRow}>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Évalués</span>
                  <span className={styles.detailStatValue}>
                    {selector.selected}
                  </span>
                </div>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Total assignés</span>
                  <span className={styles.detailStatValue}>
                    {selector.total}
                  </span>
                </div>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Progression</span>
                  <span className={styles.detailStatValue}>
                    {selector.progressPercent}%
                  </span>
                </div>
                <div className={styles.detailStat}>
                  <span className={styles.detailStatLabel}>Statut</span>
                  <span
                    className={`${styles.statusBadge} ${
                      selector.status === "termine"
                        ? styles.statusTermine
                        : styles.statusEnCours
                    }`}
                    style={{ marginTop: "4px" }}
                  >
                    {selector.status === "termine" ? "✓ Terminé" : "En cours"}
                  </span>
                </div>
              </div>

              {/* Assignments List */}
              <div className={styles.assignmentsList}>
                <h2 className={styles.assignmentsTitle}>
                  Candidats assignés ({selector.assignments.length})
                </h2>

                {selector.assignments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptySubtitle}>
                      Aucun candidat assigné à ce sélecteur.
                    </div>
                  </div>
                ) : (
                  selector.assignments.map((assignment) => (
                    <div key={assignment.id} className={styles.assignmentCard}>
                      <div>
                        <div className={styles.assignmentCandName}>
                          {assignment.candidateName}
                        </div>
                        <div className={styles.assignmentCandEmail}>
                          {assignment.candidateEmail}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`${styles.assignmentDecision} ${getDecisionClass(assignment.decision)}`}
                        >
                          {getDecisionLabel(assignment.decision)}
                        </span>
                        {assignment.evaluatedAt && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#8C8F8E",
                              marginTop: "4px",
                              textAlign: "right",
                            }}
                          >
                            {new Date(assignment.evaluatedAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  );
}
