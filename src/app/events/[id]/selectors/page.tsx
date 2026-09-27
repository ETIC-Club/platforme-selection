"use client";

import React, { useState, useEffect, use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlusIcon } from "@/components/Icons";
import { SelectorDisplay } from "@/services/dataService";
import styles from "@/components/dashboard.module.css";

interface SelectorsPageProps {
  params: Promise<{ id: string }>;
}

export default function SelectorsPage({ params }: SelectorsPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;
  const [filter, setFilter] = useState<"all" | "RH" | "Technique" | "en_cours" | "termine">("all");
  const [selectors, setSelectors] = useState<SelectorDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string>(`Event #${eventId}`);

  useEffect(() => {
    let isMounted = true;
    async function loadSelectors() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}/selectors`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.selectors) setSelectors(data.selectors);
            if (data.eventName) setEventName(data.eventName);
          }
        }
      } catch (e) {
        console.error("Failed to load selectors:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSelectors();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const allCount = selectors.length;
  const rhCount = selectors.filter((s) => s.type === "RH").length;
  const techCount = selectors.filter((s) => s.type === "Technique").length;
  const inProgressCount = selectors.filter((s) => s.status === "en_cours").length;
  const completedCount = selectors.filter((s) => s.status === "termine").length;

  const filteredSelectors = selectors.filter((s) => {
    if (filter === "RH") return s.type === "RH";
    if (filter === "Technique") return s.type === "Technique";
    if (filter === "en_cours") return s.status === "en_cours";
    if (filter === "termine") return s.status === "termine";
    return true;
  });

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ role }) => {
        if (role !== "SUPER_ADMIN") {
          return (
            <div className={styles.mainCard}>
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-primary-red)" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "700" }}>Accès Restreint</h1>
                <p style={{ fontSize: "14px", marginTop: "8px", color: "#6B7280" }}>
                  La gestion des sélecteurs est réservée aux administrateurs.
                </p>
              </div>
            </div>
          );
        }

        const canManage = role === "SUPER_ADMIN";

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.pageTitle}>Selectors</h1>
                <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                  Assigned evaluators and completion tracking for Event #{eventId}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className={styles.filterPillsRow}>
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`${styles.filterPill} ${filter === "all" ? styles.filterPillActive : ""}`}
                  >
                    All ({allCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("RH")}
                    className={`${styles.filterPill} ${filter === "RH" ? styles.filterPillActive : ""}`}
                  >
                    RH ({rhCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("Technique")}
                    className={`${styles.filterPill} ${filter === "Technique" ? styles.filterPillActive : ""}`}
                  >
                    Technique ({techCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("en_cours")}
                    className={`${styles.filterPill} ${filter === "en_cours" ? styles.filterPillActive : ""}`}
                  >
                    En cours ({inProgressCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("termine")}
                    className={`${styles.filterPill} ${filter === "termine" ? styles.filterPillActive : ""}`}
                  >
                    Terminé ({completedCount})
                  </button>
                </div>

                {canManage && (
                  <button
                    type="button"
                    className={styles.addEventBtn}
                    onClick={() => alert("Ajouter un nouveau sélecteur à cet événement")}
                  >
                    <PlusIcon />
                    <span>ADD SELECTOR</span>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.eventsList}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8C8F8E" }}>
                  <p>Chargement des sélecteurs...</p>
                </div>
              ) : filteredSelectors.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>Aucun sélecteur trouvé</p>
                  <p style={{ fontSize: "13px", marginTop: "6px" }}>
                    Aucun évaluateur ne correspond au filtre sélectionné.
                  </p>
                </div>
              ) : (
                filteredSelectors.map((sel) => {
                  const pct = sel.assignedCount > 0
                    ? Math.round((sel.evaluatedCount / sel.assignedCount) * 100)
                    : 0;
                  const initials = sel.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div key={sel.id} className={styles.itemCard}>
                      <div className={styles.cardLeft}>
                        <div
                          className={styles.eventThumbnail}
                          style={{
                            width: "50px",
                            height: "50px",
                            fontSize: "15px",
                            background: sel.type === "RH"
                              ? "linear-gradient(135deg, #EC9E00 0%, #C1333F 100%)"
                              : "var(--gradient-4)",
                          }}
                        >
                          {initials}
                        </div>

                        <div className={styles.eventInfo}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h2 className={styles.eventTitle} style={{ fontSize: "16px" }}>
                              {sel.name}
                            </h2>
                            <span className={sel.type === "RH" ? styles.typeBadgeRh : styles.typeBadgeTech}>
                              {sel.type}
                            </span>
                            <span
                              className={
                                sel.status === "termine"
                                  ? styles.statusBadgeAccepte
                                  : styles.statusBadgeAttente
                              }
                            >
                              {sel.status === "termine" ? "Terminé" : "En cours"}
                            </span>
                          </div>
                          <p className={styles.eventSubtitle}>{sel.email}</p>
                        </div>
                      </div>

                      <div className={styles.cardProgress} style={{ maxWidth: "260px" }}>
                        <div className={styles.progressCounts}>
                          <span className={styles.selectedCount}>
                            {sel.evaluatedCount} / {sel.assignedCount} évalués
                          </span>
                          <span className={styles.remainingCount}>{pct}%</span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct === 100 ? "var(--color-primary-green)" : "var(--color-primary-teal)",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "right", minWidth: "120px" }}>
                        Activité : <span style={{ color: "#4B5563", fontWeight: 600 }}>{sel.lastActive}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
