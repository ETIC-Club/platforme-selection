"use client";

import React, { useState, use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlusIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

interface SelectorsPageProps {
  params: Promise<{ id: string }>;
}

export default function SelectorsPage({ params }: SelectorsPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;
  const [filter, setFilter] = useState<"all" | "RH" | "Technique" | "en_cours" | "termine">("all");

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
      {({ role }) => {
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
                    All (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("RH")}
                    className={`${styles.filterPill} ${filter === "RH" ? styles.filterPillActive : ""}`}
                  >
                    RH (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("Technique")}
                    className={`${styles.filterPill} ${filter === "Technique" ? styles.filterPillActive : ""}`}
                  >
                    Technique (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("en_cours")}
                    className={`${styles.filterPill} ${filter === "en_cours" ? styles.filterPillActive : ""}`}
                  >
                    En cours (0)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("termine")}
                    className={`${styles.filterPill} ${filter === "termine" ? styles.filterPillActive : ""}`}
                  >
                    Terminé (0)
                  </button>
                </div>

                {canManage && (
                  <button
                    type="button"
                    className={styles.addEventBtn}
                    onClick={() => alert("Add Selector")}
                  >
                    <PlusIcon />
                    <span>ADD SELECTOR</span>
                  </button>
                )}
              </div>
            </div>

            <div className={styles.eventsList}>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>No selectors assigned yet</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>
                  Assign RH and Technical selectors to evaluate candidates in this event.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
