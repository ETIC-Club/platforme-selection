"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LogItem } from "@/services/dataService";
import { LogsIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await fetch("/api/logs");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.logs) {
            setLogs(data.logs);
          }
        }
      } catch (e) {
        console.error("Failed to load logs:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const getBadgeClass = (type: LogItem["badgeType"]) => {
    switch (type) {
      case "create":
        return styles.logBadgeCreate;
      case "assign":
        return styles.logBadgeAssign;
      case "evaluate":
        return styles.logBadgeEvaluate;
      default:
        return styles.logBadgeUpdate;
    }
  };

  return (
    <DashboardLayout>
      {({ role }) => {
        if (role !== "SUPER_ADMIN") {
          return (
            <div className={styles.mainCard}>
              <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-primary-red)" }}>
                <h1 style={{ fontSize: "20px", fontWeight: "700" }}>Access Denied</h1>
                <p style={{ fontSize: "14px", marginTop: "8px", color: "#6B7280" }}>
                  System logs are strictly restricted to Super Administrators.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.pageTitle}>SYSTEM LOGS</h1>
                <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                  Journal d'audit en temps réel des actions système, assignations et évaluations
                </p>
              </div>
            </div>

            <div className={styles.eventsList}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8C8F8E" }}>
                  <p>Chargement des logs d'audit...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                  <p style={{ fontSize: "16px", fontWeight: "600" }}>No logs recorded yet</p>
                  <p style={{ fontSize: "13px", marginTop: "6px" }}>
                    System security actions and audit events will appear here.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={styles.itemCard}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1 }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          backgroundColor: "#F3F4F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--color-primary-teal)",
                          flexShrink: 0,
                        }}
                      >
                        <LogsIcon />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span className={`${styles.logBadge} ${getBadgeClass(log.badgeType)}`}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                            {log.actorName}
                          </span>
                          <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                            ({log.actorRole})
                          </span>
                        </div>

                        <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.4" }}>
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {log.timestamp}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
