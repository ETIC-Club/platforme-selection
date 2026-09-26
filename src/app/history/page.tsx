"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import styles from "@/components/dashboard.module.css";

export default function HistoryPage() {
  return (
    <DashboardLayout>
      {() => {
        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <h1 className={styles.pageTitle}>HISTORY</h1>
            </div>

            <div className={styles.eventsList}>
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "16px", fontWeight: "600" }}>No history entries</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>
                  Historical logs and past event records will be displayed here.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
