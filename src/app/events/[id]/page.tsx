"use client";

import React, { use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import styles from "@/components/dashboard.module.css";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function InsideEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
      {() => <div className={styles.mainCard} />}
    </DashboardLayout>
  );
}
