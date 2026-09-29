"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeftIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import { CandidateList } from "@/components/candidates/CandidateList";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ToReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";

  const [eventName] = useState<string>(`Event #${eventId}`);

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ searchQuery, role }) => {
        if ((role as any) === "SUPER_ADMIN" || isAdmin) {
          // Admins can see this
        }

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Link
                    href={`/events/${eventId}`}
                    className={styles.backLink}
                    style={{ fontSize: "14px" }}
                  >
                    <ArrowLeftIcon />
                    <span>Retour à l&apos;événement</span>
                  </Link>
                </div>
                <h1 className={styles.pageTitle} style={{ marginTop: "6px" }}>
                  À traiter (Event #{eventId})
                </h1>
                <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                  Candidatures en attente de décision.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <CandidateList
                eventId={eventId}
                status="none"
                initialItems={[]}
                initialNextCursor={null}
                initialTotal={0}
                showDecisionControl={role === "SELECTOR_RH" || role === "SELECTOR_TECHNIQUE" || (role as any) === "SUPER_ADMIN" || isAdmin}
                searchQuery={searchQuery}
                autoFetch={true}
                layoutMode="to-review"
              />
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
