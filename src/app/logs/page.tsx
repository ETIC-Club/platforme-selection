"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import styles from "@/components/dashboard.module.css";

export default function LogsPage() {
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
              <h1 className={styles.pageTitle}>SYSTEM LOGS</h1>
            </div>

            <div className={styles.eventsList}>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>No logs recorded yet</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>
                  System security actions and audit events will appear here.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
