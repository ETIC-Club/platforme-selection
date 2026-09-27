"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { HistoryEventItem } from "@/services/dataService";
import { ClockIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

export default function HistoryPage() {
  const [historyEvents, setHistoryEvents] = useState<HistoryEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.events) {
            setHistoryEvents(data.events);
          }
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      {({ role }) => {
        if (role !== "SUPER_ADMIN") {
          return (
            <div className={styles.mainCard}>
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-primary-red)" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "700" }}>Accès Restreint</h1>
                <p style={{ fontSize: "14px", marginTop: "8px", color: "#6B7280" }}>
                  L'historique des sélections est réservé aux administrateurs.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.pageTitle}>HISTORY</h1>
                <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                  Événements clôturés et archives des sélections passées
                </p>
              </div>
            </div>

            <div className={styles.eventsList}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8C8F8E" }}>
                  <p>Chargement de l'historique...</p>
                </div>
              ) : historyEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>Aucun événement archivé</p>
                  <p style={{ fontSize: "13px", marginTop: "6px" }}>
                    Les événements terminés apparaîtront ici.
                  </p>
                </div>
              ) : (
                historyEvents.map((ev, idx) => {
                  const initials = ev.name
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const gradientBg =
                    idx % 3 === 0
                      ? "var(--gradient-1)"
                      : idx % 3 === 1
                      ? "var(--gradient-4)"
                      : "var(--gradient-5)";

                  return (
                    <div key={ev.id} className={styles.eventCard}>
                      <div className={styles.cardLeft}>
                        <div
                          className={styles.eventThumbnail}
                          style={{ background: gradientBg }}
                        >
                          {initials}
                        </div>

                        <div className={styles.eventInfo}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h2 className={styles.eventTitle}>{ev.name}</h2>
                            <span className={styles.statusBadgeRefuse} style={{ fontSize: "10px", padding: "2px 6px" }}>
                              CLÔTURÉ
                            </span>
                          </div>
                          <p className={styles.eventSubtitle}>{ev.category}</p>
                          <span className={styles.eventQuota}>
                            {ev.totalCandidates} candidatures traitées
                          </span>
                        </div>
                      </div>

                      <div className={styles.cardProgress} style={{ maxWidth: "260px" }}>
                        <div className={styles.progressCounts}>
                          <span className={styles.selectedCount}>
                            {ev.selectedCount} Sélectionnés
                          </span>
                          <span className={styles.remainingCount}>
                            Taux : {ev.acceptanceRate}
                          </span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: ev.acceptanceRate, backgroundColor: "var(--color-primary-teal)" }}
                          />
                        </div>
                      </div>

                      <div className={styles.cardRight}>
                        <div className={styles.deadlineContainer}>
                          <ClockIcon className={styles.deadlineIcon} />
                          <span>Clôturé le {ev.closedDate}</span>
                        </div>
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
