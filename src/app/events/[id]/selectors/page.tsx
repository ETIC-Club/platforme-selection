"use client";

import React, { use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import styles from "@/components/dashboard.module.css";

interface SelectorsPageProps {
  params: Promise<{ id: string }>;
}

export default function SelectorsPage({ params }: SelectorsPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
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
