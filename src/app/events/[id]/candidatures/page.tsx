"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeftIcon } from "@/components/Icons";
import { CandidateDetail } from "@/services/candidateService";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import { CandidateList } from "@/components/candidates/CandidateList";
import { SelectorCandidatesView } from "@/components/SelectorCandidatesView";

interface CandidaturesPageProps {
  params: Promise<{ id: string }>;
}

export default function CandidaturesPage({ params }: CandidaturesPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";

  const [candidates, setCandidates] = useState<CandidateDetail[]>([]);
  const [eventName, setEventName] = useState<string>(`Event #${eventId}`);

  useEffect(() => {
    let isMounted = true;
    async function loadCandidates() {
      try {
        const res = await fetch(`/api/events/${eventId}/candidates`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.candidates) setCandidates(data.candidates);
            if (data.eventName) setEventName(data.eventName);
          }
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
      }
    }

    loadCandidates();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ searchQuery, role }) => {
        // ADMIN VIEW - Strict preservation of the admin candidate table
        if (role === "SUPER_ADMIN" || isAdmin) {
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
                    Candidatures (Event #{eventId})
                  </h1>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                    Consultez les stories des candidats et soumettez vos évaluations.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <CandidateList
                  eventId={eventId}
                  status="all"
                  initialItems={[]}
                  initialNextCursor={null}
                  initialTotal={0}
                  showStatusSwitch
                  showDecisionControl={true}
                  searchQuery={searchQuery}
                  autoFetch={true}
                />
              </div>
            </div>
          );
        }

        // SELECTOR VIEW - Pixel-perfect Story / Carousel candidate evaluation experience
        return (
          <SelectorCandidatesView
            eventId={eventId}
            eventName={eventName}
            initialCandidates={candidates}
            onEvaluationSuccess={() => {
              fetch(`/api/events/${eventId}/candidates`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.candidates) setCandidates(d.candidates);
                })
                .catch(() => {});
            }}
          />
        );
      }}
    </DashboardLayout>
  );
}
