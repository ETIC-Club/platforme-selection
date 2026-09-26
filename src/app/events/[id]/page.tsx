"use client";

import React, { use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UsersIcon, ClipboardIcon, ArrowRightIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function InsideEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: `Event #${eventId}` }}>
      {({ role }) => {
        return (
          <div className={styles.mainCard}>
            {/* Event Header Banner */}
            <div className={styles.eventBannerHeader}>
              <div className={styles.bannerTitleArea}>
                <span className={styles.bannerSubtitle}>Event Overview</span>
                <h1 className={styles.bannerEventName}>Event #{eventId}</h1>
              </div>

              <div className={styles.filterPillsRow}>
                <Link
                  href={`/events/${eventId}/candidatures`}
                  className={styles.filterPillActive}
                  style={{ textDecoration: "none" }}
                >
                  View Candidatures
                </Link>
                {role === "SUPER_ADMIN" && (
                  <Link
                    href={`/events/${eventId}/selectors`}
                    className={styles.filterPill}
                    style={{ textDecoration: "none" }}
                  >
                    Manage Selectors
                  </Link>
                )}
              </div>
            </div>

            {/* Section Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
              <div className={styles.statCard} style={{ padding: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <ClipboardIcon />
                    <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Candidatures Pipeline</h2>
                  </div>
                  <Link
                    href={`/events/${eventId}/candidatures`}
                    className={styles.arrowButton}
                    aria-label="Go to candidatures"
                  >
                    <ArrowRightIcon />
                  </Link>
                </div>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.5" }}>
                  Review candidate profiles, check evaluations from RH and Technical selectors, and submit final decisions.
                </p>
              </div>

              <div className={styles.statCard} style={{ padding: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <UsersIcon />
                    <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Event Selectors</h2>
                  </div>
                  <Link
                    href={`/events/${eventId}/selectors`}
                    className={styles.arrowButton}
                    aria-label="Go to selectors"
                  >
                    <ArrowRightIcon />
                  </Link>
                </div>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.5" }}>
                  Monitor evaluation progress, manage assigned RH and Technical selectors, and inspect completion status.
                </p>
              </div>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
