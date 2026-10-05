"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowRightIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import selStyles from "@/app/selectors/selectors.module.css";

// ────────────────────────────────────────────────────────────────
// /events/[id] — Event dashboard page
//
// Shows a summary of the event: quick stats, a preview of
// assigned selectors, and a preview of recent candidates.
// Links to the full selectors and candidatures pages.
// ────────────────────────────────────────────────────────────────

interface EventPageProps {
  params: Promise<{ id: string }>;
}

interface SelectorPreview {
  id: number;
  selectorType: string;
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
}

export default function InsideEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  const [eventName, setEventName] = useState(`Event #${eventId}`);
  const [selectors, setSelectors] = useState<SelectorPreview[]>([]);
  const [candidates, setCandidates] = useState<CandidatePreview[]>([]);
  const [loadingSelectors, setLoadingSelectors] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      try {
        const evRes = await fetch(`/api/events/${eventId}`);
        if (evRes.ok) {
          const evData = await evRes.json();
          if (isMounted && evData.event?.name) {
            setEventName(evData.event.name);
          }
        }
      } catch {
        // event name stays as default
      }
    }

    async function loadSelectors() {
      try {
        const res = await fetch(`/api/events/${eventId}/selectors`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.selectors) {
            setSelectors(data.selectors);
          }
        }
      } catch {
        // silently fail
      } finally {
        if (isMounted) setLoadingSelectors(false);
      }
    }

    async function loadCandidates() {
      try {
        const res = await fetch(`/api/events/${eventId}/candidates`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.candidates) {
            setCandidates(data.candidates);
          }
        }
      } catch {
        // silently fail
      } finally {
        if (isMounted) setLoadingCandidates(false);
      }
    }

    loadEvent();
    loadSelectors();
    loadCandidates();

    return () => { isMounted = false; };
  }, [eventId]);

  const getInitials = (name: string | null, email: string): string => {
    const src = name || email;
    return src
      .split(/[\s@]/)
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {() => (
        <div className={styles.mainCard}>
          <div className={styles.mainHeader}>
            <h1 className={styles.pageTitle}>{eventName}</h1>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
            {isAdmin && (
              <div className={selStyles.detailStat}>
                <span className={selStyles.detailStatLabel}>Sélecteurs</span>
                <span className={selStyles.detailStatValue}>
                  {loadingSelectors ? "…" : selectors.length}
                </span>
              </div>
            )}
            <div className={selStyles.detailStat}>
              <span className={selStyles.detailStatLabel}>Candidats</span>
              <span className={selStyles.detailStatValue}>
                {loadingCandidates ? "…" : candidates.length}
              </span>
            </div>
          </div>

          {/* Selectors Section — admin only */}
          {isAdmin && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                Sélecteurs ({loadingSelectors ? "…" : selectors.length})
              </h2>
              <Link
                href={`/events/${eventId}/selectors`}
                style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-teal)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
              >
                Voir tout <ArrowRightIcon />
              </Link>
            </div>

            {loadingSelectors ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#8C8F8E", fontSize: "13px" }}>
                Chargement...
              </div>
            ) : selectors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>Aucun sélecteur</p>
                <Link
                  href={`/events/${eventId}/selectors`}
                  style={{ fontSize: "13px", color: "var(--color-primary-teal)", fontWeight: 600, textDecoration: "none" }}
                >
                  Ajouter des sélecteurs →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectors.slice(0, 5).map((sel) => (
                  <div
                    key={sel.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className={selStyles.selectorAvatar} style={{ width: "38px", height: "38px", minWidth: "38px", fontSize: "13px" }}>
                      {getInitials(sel.user.fullName, sel.user.email)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-secondary-black)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sel.user.fullName || sel.user.email}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8C8F8E" }}>
                        {sel.user.email}
                      </div>
                    </div>
                    <span
                      className={`${selStyles.roleBadge} ${sel.selectorType === "RH" ? selStyles.roleBadgeRH : selStyles.roleBadgeTechnique}`}
                    >
                      {sel.selectorType === "RH" ? "RH" : "DEV"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: sel.isActive ? "var(--color-primary-green)" : "#8C8F8E" }}>
                      {sel.isActive ? "● Actif" : "● Inactif"}
                    </span>
                  </div>
                ))}
                {selectors.length > 5 && (
                  <Link
                    href={`/events/${eventId}/selectors`}
                    style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-teal)", textAlign: "center", textDecoration: "none", padding: "6px" }}
                  >
                    +{selectors.length - 5} de plus →
                  </Link>
                )}
              </div>
            )}
          </div>
          )}

          {/* Candidates Section */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                Candidats ({loadingCandidates ? "…" : candidates.length})
              </h2>
              <Link
                href={`/events/${eventId}/candidatures`}
                style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-teal)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
              >
                Voir tout <ArrowRightIcon />
              </Link>
            </div>

            {loadingCandidates ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#8C8F8E", fontSize: "13px" }}>
                Chargement...
              </div>
            ) : candidates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#8C8F8E" }}>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>Aucun candidat</p>
                <Link
                  href={`/events/${eventId}/candidatures`}
                  style={{ fontSize: "13px", color: "var(--color-primary-teal)", fontWeight: 600, textDecoration: "none" }}
                >
                  Importer des candidats →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {candidates.slice(0, 8).map((cand) => {
                  const initials = `${cand.prenom?.[0] || ""}${cand.nom?.[0] || ""}`.toUpperCase();
                  return (
                    <div
                      key={cand.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 16px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          minWidth: "34px",
                          borderRadius: "8px",
                          background: "var(--gradient-4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FFF",
                          fontWeight: 700,
                          fontSize: "12px",
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                          {cand.prenom} {cand.nom}
                        </div>
                        <div style={{ fontSize: "12px", color: "#8C8F8E" }}>
                          {cand.email}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {candidates.length > 8 && (
                  <Link
                    href={`/events/${eventId}/candidatures`}
                    style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-teal)", textAlign: "center", textDecoration: "none", padding: "6px" }}
                  >
                    +{candidates.length - 8} de plus →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
