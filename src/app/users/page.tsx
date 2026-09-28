"use client";

import React from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import styles from "@/components/dashboard.module.css";

export default function UsersPage() {
  return (
    <DashboardLayout>
      {() => {
        return (
          <div className={styles.mainCard}>
            {/* Espace vierge */}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
