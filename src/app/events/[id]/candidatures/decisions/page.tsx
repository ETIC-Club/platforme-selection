"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeftIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import { CandidateList } from "@/components/candidates/CandidateList";
import { useSearchParams } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DecisionStatusPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";
  const searchParamsObj = useSearchParams();
  
  const statusParam = searchParamsObj.get("status") || "accepted";
  const validStatus = ['all', 'pending', 'accepted', 'refused'].includes(statusParam) 
    ? (statusParam as 'all' | 'pending' | 'accepted' | 'refused') 
    : 'accepted';

  const [eventName] = useState<string>(`Event #${eventId}`);

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ searchQuery, role }) => {
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
                  Decisions (Event #{eventId})
                </h1>
                <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                  Candidatures décidées ou acceptées.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <CandidateList
                eventId={eventId}
                status={validStatus}
                initialItems={[]}
                initialNextCursor={null}
                initialTotal={0}
                showStatusSwitch
                showDecisionControl={role === "SELECTOR_RH" || role === "SELECTOR_TECHNIQUE" || (role as any) === "SUPER_ADMIN" || isAdmin}
                searchQuery={searchQuery}
                autoFetch={true}
                layoutMode="decision-status"
              />
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
