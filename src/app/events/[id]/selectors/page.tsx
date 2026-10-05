"use client";

import React, { useState, useEffect, use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddSelectorModal } from "@/components/AddSelectorModal";
import { PlusIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import selStyles from "@/app/selectors/selectors.module.css";

// ────────────────────────────────────────────────────────────────
// /events/[id]/selectors — List selectors for a specific event
//
// Shows all selectors assigned to this event, with an ADD SELECTOR
// button for admins. Uses the existing GET /api/events/[id]/selectors
// backend endpoint which returns selectors with user info.
// ────────────────────────────────────────────────────────────────

interface SelectorsPageProps {
  params: Promise<{ id: string }>;
}

interface SelectorItem {
  id: number;
  selectorType: "RH" | "Technique";
  isActive: boolean;
  addedAt: string;
  user: {
    id: number;
    email: string;
    fullName: string | null;
  };
}

export default function SelectorsPage({ params }: SelectorsPageProps) {
  const resolvedParams = use(params);
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  const [selectors, setSelectors] = useState<SelectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventName, setEventName] = useState(`Event #${eventId}`);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeleteSelector = async (selectorId: number) => {
    if (!confirm("Désactiver ce sélecteur ?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}/selectors/${selectorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleReactivateSelector = async (selectorId: number) => {
    try {
      const res = await fetch(`/api/events/${eventId}/selectors/${selectorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la réactivation.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handlePermanentDelete = async (selectorId: number) => {
    if (!confirm("Supprimer définitivement ce sélecteur et ses évaluations ?")) {
      return;
    }
    try {
      const res = await fetch(
        `/api/events/${eventId}/selectors/${selectorId}?permanent=true`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors de la suppression définitive.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Fetch selectors
        const selRes = await fetch(`/api/events/${eventId}/selectors`);
        if (selRes.ok) {
          const selData = await selRes.json();
          if (isMounted && selData.selectors) {
            setSelectors(selData.selectors);
          }
        } else {
          const errData = await selRes.json().catch(() => ({}));
          if (isMounted) setError(errData.error || `Erreur ${selRes.status}`);
        }

        // Fetch event name
        const evRes = await fetch(`/api/events/${eventId}`);
        if (evRes.ok) {
          const evData = await evRes.json();
          if (isMounted && evData.event?.name) {
            setEventName(evData.event.name);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [eventId, refreshKey]);

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

  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN";

  return (
    <DashboardLayout eventContext={{ id: eventId, name: eventName }}>
      {({ searchQuery }) => {
        // Gate: only SUPER_ADMIN can see selectors
        if (!isAdmin) {
          return (
            <div className={styles.mainCard}>
              <div className={selStyles.emptyState}>
                <div className={selStyles.emptyTitle}>Accès réservé</div>
                <div className={selStyles.emptySubtitle}>
                  Seuls les administrateurs peuvent gérer les sélecteurs.
                </div>
              </div>
            </div>
          );
        }

        const filtered = selectors.filter((s) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          const name = (s.user.fullName || "").toLowerCase();
          const email = s.user.email.toLowerCase();
          const type = s.selectorType.toLowerCase();
          return name.includes(q) || email.includes(q) || type.includes(q);
        });

        return (
          <div className={styles.mainCard}>
            {/* Header */}
            <div className={styles.mainHeader}>
              <h1 className={styles.pageTitle}>Sélecteurs</h1>
              <button
                type="button"
                className={styles.addEventBtn}
                onClick={() => setShowAddModal(true)}
                aria-label="Ajouter un sélecteur"
              >
                <PlusIcon />
                <span>ADD SELECTOR</span>
              </button>
            </div>

            {/* List */}
            <div className={styles.eventsList}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={selStyles.skeletonCard}>
                    <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonAvatar}`} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonText}`} style={{ width: "140px" }} />
                      <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonText} ${selStyles.skeletonTextShort}`} />
                    </div>
                    <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonBadge}`} />
                  </div>
                ))
              ) : error ? (
                <div className={selStyles.errorState}>
                  <div className={selStyles.errorTitle}>Erreur de chargement</div>
                  <div className={selStyles.emptySubtitle}>{error}</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className={selStyles.emptyState}>
                  <div className={selStyles.emptyTitle}>Aucun sélecteur trouvé</div>
                  <div className={selStyles.emptySubtitle}>
                    {searchQuery
                      ? "Aucun sélecteur ne correspond à votre recherche."
                      : "Ajoutez des sélecteurs avec le bouton ci-dessus."}
                  </div>
                </div>
              ) : (
                filtered.map((sel) => (
                  <article key={sel.id} className={styles.itemCard}>
                    <div className={styles.candProfile}>
                      <div className={selStyles.selectorAvatar}>
                        {getInitials(sel.user.fullName, sel.user.email)}
                      </div>
                      <div className={styles.candNameGroup}>
                        <span className={styles.candName}>
                          {sel.user.fullName || sel.user.email}
                        </span>
                        <span className={styles.candEmail}>{sel.user.email}</span>
                      </div>
                    </div>

                    <span
                      className={
                        sel.selectorType === "RH"
                          ? styles.typeBadgeRh
                          : styles.typeBadgeTech
                      }
                    >
                      {sel.selectorType === "RH" ? "RH" : "DEV"}
                    </span>

                    <span
                      className={
                        sel.isActive
                          ? styles.statusTermine
                          : styles.statusEnCours
                      }
                      style={{ fontSize: "12px", fontWeight: 700 }}
                    >
                      {sel.isActive ? "Actif" : "Inactif"}
                    </span>

                    <span style={{ fontSize: "12px", color: "#8C8F8E" }}>
                      {new Date(sel.addedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>

                    {sel.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteSelector(sel.id)}
                        style={{
                          background: "rgba(193, 51, 63, 0.08)",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#C1333F",
                          cursor: "pointer",
                        }}
                        aria-label={`Désactiver ${sel.user.fullName || sel.user.email}`}
                      >
                        Désactiver
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleReactivateSelector(sel.id)}
                          style={{
                            background: "rgba(34, 139, 94, 0.1)",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#228B5E",
                            cursor: "pointer",
                          }}
                          aria-label={`Réactiver ${sel.user.fullName || sel.user.email}`}
                        >
                          Activer
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(sel.id)}
                          style={{
                            background: "rgba(193, 51, 63, 0.08)",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#C1333F",
                            cursor: "pointer",
                          }}
                          aria-label={`Supprimer définitivement ${sel.user.fullName || sel.user.email}`}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>

            {/* Add Selector Modal */}
            {showAddModal && (
              <AddSelectorModal
                eventId={eventId}
                onClose={() => setShowAddModal(false)}
                onSelectorAdded={() => setRefreshKey((k) => k + 1)}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
