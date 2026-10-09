"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  UsersIcon,
  GridIcon,
  BanIcon,
  ClockIcon,
  CalendarIcon,
  BarChartIcon,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { SelectorDashboardView } from "@/components/SelectorDashboardView";
import styles from "./eventDashboard.module.css";

// ────────────────────────────────────────────────────────────────
// /events/[id] — Event Dashboard (Selector & Admin views)
// Matching Figma designs for Desktop and Mobile
// ────────────────────────────────────────────────────────────────

interface EventPageProps {
  params: Promise<{ id: string }>;
}

interface SelectorPreview {
  id: number;
  selectorType: "RH" | "Technique";
  isActive: boolean;
  user: {
    id: number;
    email: string;
    fullName: string | null;
  };
}

interface CandidatePreview {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  finalStatus?: string | null;
  progressPct?: number;
  statusNote?: string;
}

export default function InsideEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";

  const [eventName, setEventName] = useState("TRAINING CAMP XIII");
  const [selectors, setSelectors] = useState<SelectorPreview[]>([]);
  const [candidates, setCandidates] = useState<CandidatePreview[]>([]);
  const [quota, setQuota] = useState<number>(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load Event Details
        const evRes = await fetch(`/api/events/${eventId}`);
        if (evRes.ok) {
          const evData = await evRes.json();
          if (isMounted && evData.event) {
            if (evData.event.name) setEventName(evData.event.name);
            if (evData.event.quotaParticipants) setQuota(evData.event.quotaParticipants);
          }
        }

        // Load Selectors
        const selRes = await fetch(`/api/events/${eventId}/selectors`);
        if (selRes.ok) {
          const selData = await selRes.json();
          if (isMounted && selData.selectors) {
            setSelectors(selData.selectors);
          }
        }

        // Load Candidates
        const candRes = await fetch(`/api/events/${eventId}/candidates`);
        if (candRes.ok) {
          const candData = await candRes.json();
          if (isMounted && candData.candidates) {
            setCandidates(candData.candidates);
          }
        }
      } catch (err) {
        console.error("Failed to load event dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Derived or default statistics aligned with design
  const affectedCount = candidates.length > 0 ? candidates.length : 120;
  const placesRestantes = Math.max(0, quota > 0 ? quota - (candidates.length || 48) : 12);
  const refuseesCount = 54;
  const enAttenteCount = 36;

  // Selectors for preview (fall back to design data if none registered)
  const previewSelectors =
    selectors.length > 0
      ? selectors.slice(0, 3).map((s, idx) => ({
          name: s.user.fullName || `person ${idx + 1}`,
          role: s.selectorType === "RH" ? "RH" : "Technique",
        }))
      : [
          { name: "person 1", role: "RH" },
          { name: "person 2", role: "Technique" },
          { name: "person 3", role: "RH" },
        ];

  // Candidates for preview (fall back to design mock data if empty)
  const previewCandidates =
    candidates.length > 0
      ? candidates.slice(0, 2).map((c, idx) => ({
          name: `${c.prenom || ""} ${c.nom || ""}`.trim() || "Toudert Emilia",
          initials: `${c.prenom?.[0] || "T"}${c.nom?.[0] || "E"}`.toUpperCase(),
          statusNote: idx === 0 ? "Dossier complet" : "En révision",
          progressPct: idx === 0 ? 74 : 75,
          color: idx === 0 ? "yellow" : "red",
        }))
      : [
          {
            name: "Toudert Emilia",
            initials: "TE",
            statusNote: "Dossier complet",
            progressPct: 74,
            color: "yellow",
          },
          {
            name: "Toudert Emilia",
            initials: "TE",
            statusNote: "En révision",
            progressPct: 75,
            color: "red",
          },
        ];

  // Calculate technique vs RH percentage
  const techSelectorsCount = selectors.filter((s) => s.selectorType === "Technique").length;
  const rhSelectorsCount = selectors.filter((s) => s.selectorType === "RH").length;
  const totalSelectors = techSelectorsCount + rhSelectorsCount;
  const techPct = totalSelectors > 0 ? Math.round((techSelectorsCount / totalSelectors) * 100) : 70;
  const rhPct = totalSelectors > 0 ? 100 - techPct : 30;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {() => {
        // If the user is NOT an admin (i.e. they are a selector), display the Selector Dashboard
        if (!isAdmin) {
          return (
            <SelectorDashboardView
              eventId={eventId}
              eventName={eventName}
            />
          );
        }

        // If the user IS an admin (SUPER_ADMIN), display the original Admin Dashboard
        return (
          <div className={styles.dashboardContainer}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>{eventName}</h1>
              <p className={styles.pageSubtitle}>Vue d&apos;ensemble des candidatures</p>
            </div>

          {/* 4 Stat Cards */}
          <div className={styles.statsRow}>
            {/* Card 1: Affectées */}
            <div className={`${styles.statCard} ${styles.cardGreen}`}>
              <div className={styles.statCardTop}>
                <div className={styles.statCardIconCircle}>
                  <UsersIcon width={16} height={16} />
                </div>
                <span className={styles.statCardTitle}>Affectées</span>
              </div>
              <div className={styles.statCardValue}>{affectedCount}</div>
              <div className={styles.statCardFooter}>
                <span>↗ +6% aujourd&apos;hui</span>
              </div>
            </div>

            {/* Card 2: Places restantes */}
            <div className={`${styles.statCard} ${styles.cardAmber}`}>
              <div className={styles.statCardTop}>
                <div className={styles.statCardIconCircle}>
                  <GridIcon width={16} height={16} />
                </div>
                <span className={styles.statCardTitle}>Places restantes</span>
              </div>
              <div className={styles.statCardValue}>{placesRestantes}</div>
              <div className={styles.statCardFooter}>
                <span>Capacité limite</span>
              </div>
            </div>

            {/* Card 3: Refusées */}
            <div className={`${styles.statCard} ${styles.cardCrimson}`}>
              <div className={styles.statCardTop}>
                <div className={styles.statCardIconCircle}>
                  <BanIcon width={16} height={16} />
                </div>
                <span className={styles.statCardTitle}>Refusées</span>
              </div>
              <div className={styles.statCardValue}>{refuseesCount}</div>
              <div className={styles.statCardFooter}>
                <span>↘ -2% aujourd&apos;hui</span>
              </div>
            </div>

            {/* Card 4: En attente */}
            <div className={`${styles.statCard} ${styles.cardTeal}`}>
              <div className={styles.statCardTop}>
                <div className={styles.statCardIconCircle}>
                  <ClockIcon width={16} height={16} />
                </div>
                <span className={styles.statCardTitle}>En attente</span>
              </div>
              <div className={styles.statCardValue}>{enAttenteCount}</div>
              <div className={styles.statCardFooter}>
                <span>— En cours</span>
              </div>
            </div>
          </div>

          {/* 2 Columns Main Grid */}
          <div className={styles.mainGrid}>
            {/* Left Column */}
            <div className={styles.gridColumn}>
              {/* Card A: Sélecteurs */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardHeaderIcon}>
                      <UsersIcon width={18} height={18} />
                    </div>
                    <h2 className={styles.cardTitle}>Sélecteurs</h2>
                  </div>
                  <Link href={`/events/${eventId}/selectors`} className={styles.viewMoreBtn}>
                    Voir plus
                  </Link>
                </div>

                <div className={styles.selectorsList}>
                  {previewSelectors.map((sel, idx) => (
                    <div key={idx} className={styles.selectorItem}>
                      <span className={styles.selectorName}>{sel.name}</span>
                      <span
                        className={
                          sel.role === "RH" ? styles.roleBadgeRH : styles.roleBadgeTech
                        }
                      >
                        {sel.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Prochaines étapes */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardHeaderIcon}>
                      <CalendarIcon width={18} height={18} />
                    </div>
                    <h2 className={styles.cardTitle}>Prochaines étapes</h2>
                  </div>
                </div>

                <div className={styles.timeline}>
                  {/* Step 1 */}
                  <div className={styles.timelineStep}>
                    <div className={styles.timelineMarker}>
                      <div className={styles.timelineDotRed} />
                      <div className={styles.timelineLine} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineStepTitle}>Clôture des dossiers</div>
                      <div className={styles.timelineStepDate}>20 Janvier 2026</div>
                      <span className={styles.timelineBadgeRed}>Dans 5 jours</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className={styles.timelineStep}>
                    <div className={styles.timelineMarker}>
                      <div className={styles.timelineDotYellow} />
                      <div className={styles.timelineLine} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineStepTitle}>Export vers Google Sheets</div>
                      <div className={styles.timelineStepDate}>25-28 Janvier 2026</div>
                      <span className={styles.timelineBadgeYellow}>Planifié</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={styles.timelineStep}>
                    <div className={styles.timelineMarker}>
                      <div className={styles.timelineDotGreen} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineStepTitle}>Résultats finaux</div>
                      <div className={styles.timelineStepDate}>05 Février 2026</div>
                      <span className={styles.timelineBadgeGreen}>À venir</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.gridColumn}>
              {/* Card C: Répartition des sélecteurs */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardHeaderIcon}>
                      <BarChartIcon width={18} height={18} />
                    </div>
                    <h2 className={styles.cardTitle}>Répartition des sélecteurs</h2>
                  </div>
                </div>

                <div className={styles.progressList}>
                  <div className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span>Technique</span>
                      <span className={styles.progressPct}>{techPct}%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBarCrimson}
                        style={{ width: `${techPct}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.progressItem}>
                    <div className={styles.progressHeader}>
                      <span>RH</span>
                      <span className={styles.progressPct}>{rhPct}%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressBarAmber}
                        style={{ width: `${rhPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card D: Candidatures en attente */}
              <div className={styles.contentCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.cardHeaderIcon}>
                      <UsersIcon width={18} height={18} />
                    </div>
                    <h2 className={styles.cardTitle}>Candidatures en attente</h2>
                  </div>
                  <Link href={`/events/${eventId}/candidatures`} className={styles.viewMoreBtn}>
                    Voir plus
                  </Link>
                </div>

                <div className={styles.candidatesTableHeader}>
                  <span>NOM</span>
                  <span>état</span>
                </div>

                <div className={styles.candidatesList}>
                  {previewCandidates.map((cand, idx) => (
                    <div key={idx} className={styles.candidateRow}>
                      <div className={styles.candidateLeft}>
                        <div
                          className={
                            cand.color === "yellow"
                              ? styles.candidateAvatarYellow
                              : styles.candidateAvatarRed
                          }
                        >
                          {cand.initials}
                        </div>
                        <span className={styles.candidateName}>{cand.name}</span>
                      </div>

                      <div className={styles.candidateProgressBarTrack}>
                        <div
                          className={styles.candidateProgressBarFill}
                          style={{ width: `${cand.progressPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }}
  </DashboardLayout>
);
}
