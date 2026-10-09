"use client";

import React from "react";
import Link from "next/link";
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  CalendarIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "./Icons";
import styles from "@/app/events/[id]/selectorDashboard.module.css";

interface SelectorDashboardViewProps {
  eventId: number;
  eventName: string;
}

export function SelectorDashboardView({
  eventId,
  eventName,
}: SelectorDashboardViewProps) {
  // Statistics matching mockup
  const assigneesCount = 20;
  const evalueesCount = 12;
  const restantesCount = 8;
  const progressionPct = 60;

  // Decisions breakdown: Acceptées: 5, Refusées: 4, En attente: 3 (Total = 12)
  const accepteesCount = 5;
  const refuseesCount = 4;
  const enAttenteCount = 3;

  const accepteesPct = Math.round((accepteesCount / evalueesCount) * 100);
  const refuseesPct = Math.round((refuseesCount / evalueesCount) * 100);
  const enAttentePct = Math.round((enAttenteCount / evalueesCount) * 100);

  // Candidates list matching mockup
  const myCandidates = [
    {
      id: 1,
      name: "Toudert Emilia",
      initials: "TE",
      track: "Développement web · Dossier #TC-184",
      suivi: "Décision enregistrée",
      decision: "Acceptée",
      badgeType: "green",
      avatarColor: "green",
      href: `/events/${eventId}/candidatures`,
    },
    {
      id: 2,
      name: "Toudert Emilia",
      initials: "TE",
      track: "Data & IA · Dossier #TC-197",
      suivi: "Décision enregistrée",
      decision: "En attente",
      badgeType: "yellow",
      avatarColor: "red",
      href: `/events/${eventId}/candidatures`,
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Header with Event Title */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>{eventName}</h1>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className={styles.statsRow}>
        {/* Card 1: Assignées */}
        <div className={`${styles.statCard} ${styles.cardGreen}`}>
          <div className={styles.statCardTop}>
            <div className={styles.statCardIconCircle}>
              <UsersIcon width={16} height={16} />
            </div>
            <span className={styles.statCardTitle}>Assignées</span>
          </div>
          <div className={styles.statCardValue}>{assigneesCount}</div>
          <div className={styles.statCardFooter}>
            <span>candidatures</span>
          </div>
        </div>

        {/* Card 2: Évaluées */}
        <div className={`${styles.statCard} ${styles.cardAmber}`}>
          <div className={styles.statCardTop}>
            <div className={styles.statCardIconCircle}>
              <CheckCircleIcon width={16} height={16} />
            </div>
            <span className={styles.statCardTitle}>Évaluées</span>
          </div>
          <div className={styles.statCardValue}>{evalueesCount}</div>
          <div className={styles.statCardFooter}>
            <span>sur {assigneesCount}</span>
          </div>
        </div>

        {/* Card 3: Restantes */}
        <div className={`${styles.statCard} ${styles.cardCrimson}`}>
          <div className={styles.statCardTop}>
            <div className={styles.statCardIconCircle}>
              <ClockIcon width={16} height={16} />
            </div>
            <span className={styles.statCardTitle}>Restantes</span>
          </div>
          <div className={styles.statCardValue}>{restantesCount}</div>
          <div className={styles.statCardFooter}>
            <span>à traiter</span>
          </div>
        </div>

        {/* Card 4: Progression */}
        <div className={`${styles.statCard} ${styles.cardTeal}`}>
          <div className={styles.statCardTop}>
            <div className={styles.statCardIconCircle}>
              <TrendingUpIcon width={16} height={16} />
            </div>
            <span className={styles.statCardTitle}>Progression</span>
          </div>
          <div className={styles.statCardValue}>{progressionPct}%</div>
          <div className={styles.statCardFooter}>
            <span>objectif 100%</span>
          </div>
          <div className={styles.progressionTrack}>
            <div
              className={styles.progressionFill}
              style={{ width: `${progressionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Middle Grid: Mes décisions & Prochaines étapes */}
      <div className={styles.middleGrid}>
        {/* Left Card: Mes décisions */}
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardHeaderIcon}>
                <ClockIcon width={18} height={18} />
              </div>
              <h2 className={styles.cardTitle}>Mes décisions</h2>
            </div>
          </div>

          <div className={styles.decisionsList}>
            {/* Acceptées */}
            <div className={styles.decisionItem}>
              <div className={styles.decisionRowTop}>
                <span>Acceptées</span>
                <span className={styles.decisionCountGreen}>{accepteesCount}</span>
              </div>
              <div className={styles.decisionBarTrack}>
                <div
                  className={styles.decisionBarGreen}
                  style={{ width: `${accepteesPct}%` }}
                />
              </div>
            </div>

            {/* Refusées */}
            <div className={styles.decisionItem}>
              <div className={styles.decisionRowTop}>
                <span>Refusées</span>
                <span className={styles.decisionCountRed}>{refuseesCount}</span>
              </div>
              <div className={styles.decisionBarTrack}>
                <div
                  className={styles.decisionBarRed}
                  style={{ width: `${refuseesPct}%` }}
                />
              </div>
            </div>

            {/* En attente */}
            <div className={styles.decisionItem}>
              <div className={styles.decisionRowTop}>
                <span>En attente</span>
                <span className={styles.decisionCountYellow}>{enAttenteCount}</span>
              </div>
              <div className={styles.decisionBarTrack}>
                <div
                  className={styles.decisionBarYellow}
                  style={{ width: `${enAttentePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Prochaines étapes */}
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

      {/* Bottom Full-Width Card: Mes candidatures */}
      <div className={styles.candidaturesFullCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <div className={styles.cardHeaderIcon}>
              <UsersIcon width={18} height={18} />
            </div>
            <h2 className={styles.cardTitle}>Mes candidatures</h2>
          </div>
          <Link
            href={`/events/${eventId}/candidatures`}
            className={styles.viewMoreBtn}
          >
            Voir mes candidatures
          </Link>
        </div>

        {/* Table Header */}
        <div className={styles.tableHeaderRow}>
          <span>CANDIDATURE</span>
          <span>SUIVI</span>
          <span className={styles.tableHeaderColRight}>DÉCISION</span>
        </div>

        {/* Candidates List */}
        <div className={styles.candidatesList}>
          {myCandidates.map((cand) => (
            <div key={cand.id} className={styles.candidateItemRow}>
              <div className={styles.candidateProfile}>
                <div
                  className={
                    cand.avatarColor === "green"
                      ? styles.avatarGreen
                      : styles.avatarRed
                  }
                >
                  {cand.initials}
                </div>
                <div className={styles.candidateInfo}>
                  <span className={styles.candidateName}>{cand.name}</span>
                  <span className={styles.candidateSubtext}>{cand.track}</span>
                </div>
              </div>

              <div className={styles.candidateSuivi}>{cand.suivi}</div>

              <div className={styles.decisionActionWrapper}>
                <Link
                  href={cand.href}
                  className={
                    cand.badgeType === "green"
                      ? styles.decisionBadgeGreen
                      : styles.decisionBadgeYellow
                  }
                >
                  <span>{cand.decision}</span>
                  <ChevronRightIcon width={14} height={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Banner */}
        <div className={styles.actionBanner}>
          <div className={styles.actionBannerLeft}>
            <ClockIcon width={18} height={18} />
            <span className={styles.actionBannerText}>
              {restantesCount} candidatures restent à évaluer avant le 20 Janvier 2026.
            </span>
          </div>
          <Link
            href={`/events/${eventId}/candidatures`}
            className={styles.actionBannerBtn}
          >
            Reprendre l&apos;évaluation
          </Link>
        </div>
      </div>
    </div>
  );
}
