"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UsersIcon, ClipboardIcon, ArrowRightIcon } from "@/components/Icons";
import styles from "@/components/dashboard.module.css";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

interface EventData {
  id: number;
  name: string;
  description?: string | null;
  quotaParticipants?: number | null;
  status: string;
  candidates: Array<{ id: number; finalStatus: string }>;
  selectors: Array<{
    id: number;
    selectorType: string;
    user: { fullName?: string | null; email: string };
  }>;
}

export default function InsideEventPage({ params }: EventPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.event) {
            setEvent(data.event);
          }
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEvent();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const eventName = event?.name || `Event #${eventId}`;
  const quota = event?.quotaParticipants || 0;
  const candidates = event?.candidates || [];
  const totalCandidates = candidates.length;
  const acceptedCandidates = candidates.filter((c) => c.finalStatus === "accepte").length;
  const pendingCandidates = candidates.filter((c) => c.finalStatus === "en_attente").length;
  const rejectedCandidates = candidates.filter((c) => c.finalStatus === "refuse").length;
  const selectors = event?.selectors || [];
  const progressPercent = quota > 0 ? Math.min(100, Math.round((acceptedCandidates / quota) * 100)) : 0;

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ role }) => {
        const isAdmin = role === "SUPER_ADMIN";

        if (loading) {
          return (
            <div className={styles.mainCard} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid #E5E7EB",
                    borderTopColor: "var(--color-primary-teal)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px auto",
                  }}
                />
                <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>
                  Chargement des données de l'événement...
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className={styles.mainCard}>
            {/* Header */}
            <div className={styles.mainHeader} style={{ flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 className={styles.pageTitle} style={{ margin: 0 }}>{eventName}</h1>
                  <span
                    style={{
                      background: "rgba(2, 169, 162, 0.12)",
                      color: "var(--color-primary-teal)",
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "12px",
                      textTransform: "uppercase",
                    }}
                  >
                    {event?.status === "termine" ? "Terminé" : "En cours"}
                  </span>
                </div>
                {event?.description && (
                  <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px" }}>
                    {event.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <Link
                  href={`/events/${eventId}/candidatures`}
                  className={styles.addEventBtn}
                  style={{ textDecoration: "none" }}
                >
                  <ClipboardIcon />
                  <span>CANDIDATURES ({totalCandidates})</span>
                </Link>

                {isAdmin && (
                  <Link
                    href={`/events/${eventId}/selectors`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      color: "var(--color-secondary-black)",
                      padding: "10px 18px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <UsersIcon />
                    <span>SÉLECTEURS ({selectors.length})</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginTop: "24px",
              }}
            >
              {/* Quota Metric */}
              <div
                style={{
                  background: "#FAFAFA",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  border: "1px solid #EFEFEF",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Quota Sélectionné
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-secondary-black)", marginTop: "4px" }}>
                  {acceptedCandidates} <span style={{ fontSize: "16px", color: "#9CA3AF", fontWeight: 500 }}>/ {quota}</span>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div className={styles.progressBarTrack} style={{ height: "8px", width: "100%" }}>
                    <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px", fontWeight: 600 }}>
                    {progressPercent}% complété ({Math.max(0, quota - acceptedCandidates)} restant)
                  </div>
                </div>
              </div>

              {/* Total Candidates */}
              <div
                style={{
                  background: "#FAFAFA",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  border: "1px solid #EFEFEF",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total Candidatures
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-secondary-black)", marginTop: "4px" }}>
                  {totalCandidates}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "12px" }}>
                  Inscriptions enregistrées dans la DB
                </div>
              </div>

              {/* En attente */}
              <div
                style={{
                  background: "#FAFAFA",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  border: "1px solid #EFEFEF",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  En Attente
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary-orange, #F59E0B)", marginTop: "4px" }}>
                  {pendingCandidates}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "12px" }}>
                  À évaluer par les sélecteurs
                </div>
              </div>

              {/* Refusés */}
              <div
                style={{
                  background: "#FAFAFA",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  border: "1px solid #EFEFEF",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Refusés
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary-red, #EF4444)", marginTop: "4px" }}>
                  {rejectedCandidates}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "12px" }}>
                  Candidats non retenus
                </div>
              </div>
            </div>

            {/* Quick Actions & Selectors Banner */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginTop: "24px",
              }}
            >
              {/* Candidatures Banner */}
              <Link
                href={`/events/${eventId}/candidatures`}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(2, 169, 162, 0.08) 0%, rgba(2, 169, 162, 0.02) 100%)",
                  border: "1px solid rgba(2, 169, 162, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                    Consulter les Candidatures
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    Évaluez les profils, CV, compétences et projets des candidats.
                  </p>
                </div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--color-primary-teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <ArrowRightIcon />
                </div>
              </Link>

              {/* Selectors Banner */}
              <Link
                href={`/events/${eventId}/selectors`}
                style={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, rgba(235, 129, 60, 0.08) 0%, rgba(235, 129, 60, 0.02) 100%)",
                  border: "1px solid rgba(235, 129, 60, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-secondary-black)" }}>
                    Sélecteurs de l'Événement
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280" }}>
                    {selectors.length > 0
                      ? `${selectors.length} sélecteur(s) assigné(s) (RH & Tech).`
                      : "Aucun sélecteur assigné."}
                  </p>
                </div>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--color-primary-orange, #EB813C)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <ArrowRightIcon />
                </div>
              </Link>
            </div>
          </div>
        );
      }}
    </DashboardLayout>
  );
}
