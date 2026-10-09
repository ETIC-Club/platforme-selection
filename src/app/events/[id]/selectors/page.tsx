"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddSelectorModal } from "@/components/AddSelectorModal";
import { PlusIcon, ArrowLeftIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import selStyles from "@/app/selectors/selectors.module.css";
import tableStyles from "./selectors.module.css";

// ────────────────────────────────────────────────────────────────
// /events/[id]/selectors — List selectors for a specific event
//
// Shows all active selectors assigned to this event in a structured
// table with dedicated columns for Name, Email, Role, Status, Date, Actions.
// When "Omettre" is pressed, the selector is removed from the event directly.
// ────────────────────────────────────────────────────────────────

interface SelectorsPageProps {
  params: Promise<{ id: string }>;
}

interface SelectorItem {
  id: number;
  selectorType: "RH" | "Technique";
  isActive: boolean;
  addedAt: string;
  reviewedCount?: number;
  assignedCount?: number;
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

  // In-app confirmation dialog state
  const [omittingSelector, setOmittingSelector] = useState<SelectorItem | null>(null);
  const [omitLoading, setOmitLoading] = useState(false);

  // Success toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Execute omission: directly removes the selector from the event
  const handleConfirmOmit = async () => {
    if (!omittingSelector) return;
    setOmitLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/selectors/${omittingSelector.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const selectorName =
          omittingSelector.user.fullName || omittingSelector.user.email;
        setToastMessage(`✓ ${selectorName} a été retiré de l'événement.`);
        setOmittingSelector(null);
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erreur lors du retrait du sélecteur.");
      }
    } catch {
      alert("Erreur réseau lors de l'omission.");
    } finally {
      setOmitLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Fetch active selectors
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
    return () => {
      isMounted = false;
    };
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
        // Gate: only SUPER_ADMIN can manage selectors
        if (!isAdmin) {
          return (
            <div className={styles.mainCard}>
              <div className={selStyles.emptyState}>
                <div className={selStyles.emptyTitle}>Accès réservé</div>
                <div className={selStyles.emptySubtitle}>
                  Seuls les administrateurs peuvent gérer les sélecteurs.
                </div>
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "16px",
                    padding: "9px 18px",
                    backgroundColor: "var(--color-primary-teal, #009688)",
                    color: "#FFFFFF",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0, 150, 136, 0.25)",
                  }}
                >
                  <ArrowLeftIcon width={14} height={14} />
                  <span>Retour aux événements</span>
                </Link>
              </div>
            </div>
          );
        }

        // Only display active selectors, filtered by search query
        const activeSelectors = selectors.filter((s) => s.isActive !== false);

        const filtered = activeSelectors.filter((s) => {
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

            {/* Success Feedback Toast */}
            {toastMessage && (
              <div className={tableStyles.toastSuccess} role="status">
                <span>{toastMessage}</span>
                <button
                  type="button"
                  className={tableStyles.toastCloseBtn}
                  onClick={() => setToastMessage(null)}
                  aria-label="Fermer la notification"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Content Table / States */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
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
                  Chargement des sélecteurs de l&apos;événement...
                </p>
              </div>
            ) : error ? (
              <div className={tableStyles.emptyCard}>
                <div className={tableStyles.emptyTitle}>Erreur de chargement</div>
                <div className={tableStyles.emptySubtitle}>{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={tableStyles.emptyCard}>
                <div className={tableStyles.emptyTitle}>Aucun sélecteur actif</div>
                <div className={tableStyles.emptySubtitle}>
                  {searchQuery
                    ? "Aucun sélecteur ne correspond à votre recherche."
                    : "Ajoutez des sélecteurs pour cet événement avec le bouton ci-dessus."}
                </div>
              </div>
            ) : (
              <>
                <div className={tableStyles.tableWrapper}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th style={{ width: "24%" }}>Sélecteur</th>
                      <th style={{ width: "24%" }}>Email</th>
                      <th style={{ width: "10%" }}>Rôle</th>
                      <th style={{ width: "10%" }}>Statut</th>
                      <th style={{ width: "20%" }}>Candidats évalués</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {filtered.map((sel) => (
                      <tr key={sel.id}>
                        {/* Column 1: Nom complet + Avatar */}
                        <td>
                          <div className={tableStyles.selectorProfile}>
                            <div className={tableStyles.avatar}>
                              {getInitials(sel.user.fullName, sel.user.email)}
                            </div>
                            <span className={tableStyles.name}>
                              {sel.user.fullName || sel.user.email}
                            </span>
                          </div>
                        </td>

                        {/* Column 2: Email */}
                        <td>
                          <span className={tableStyles.email}>{sel.user.email}</span>
                        </td>

                        {/* Column 3: Rôle */}
                        <td>
                          <span
                            className={
                              sel.selectorType === "RH"
                                ? tableStyles.roleBadgeRh
                                : tableStyles.roleBadgeDev
                            }
                          >
                            {sel.selectorType === "RH" ? "RH" : "DEV"}
                          </span>
                        </td>

                        {/* Column 4: Statut */}
                        <td>
                          <span className={tableStyles.statusActive}>
                            Actif
                          </span>
                        </td>

                        {/* Column 5: Candidats évalués (ex: 0 / 20) */}
                        <td>
                          <div className={tableStyles.reviewProgress}>
                            <div className={tableStyles.reviewCount}>
                              <span className={tableStyles.reviewedNumber}>
                                {sel.reviewedCount ?? 0}
                              </span>
                              <span className={tableStyles.separator}>/</span>
                              <span className={tableStyles.assignedNumber}>
                                {sel.assignedCount ?? 20}
                              </span>
                            </div>
                            <div className={tableStyles.progressBarTrack}>
                              <div
                                className={`${tableStyles.progressBarFill} ${
                                  (sel.reviewedCount ?? 0) >= (sel.assignedCount ?? 20) &&
                                  (sel.assignedCount ?? 20) > 0
                                    ? tableStyles.progressBarFillComplete
                                    : ""
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round(
                                      ((sel.reviewedCount ?? 0) /
                                        Math.max(1, sel.assignedCount ?? 20)) *
                                        100,
                                    ),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Column 6: Action Omettre */}
                        <td>
                          <div className={tableStyles.actionGroup}>
                            <button
                              type="button"
                              className={tableStyles.omitButton}
                              onClick={() => setOmittingSelector(sel)}
                              title="Omettre ce sélecteur de l'événement"
                            >
                              Omettre
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Replaces horizontal table scroll on phones) */}
              <div className={tableStyles.mobileSelectorsList}>
                {filtered.map((sel) => {
                  const reviewed = sel.reviewedCount ?? 0;
                  const assigned = sel.assignedCount ?? 20;
                  const pct = Math.min(
                    100,
                    Math.round((reviewed / Math.max(1, assigned)) * 100)
                  );

                  return (
                    <div key={sel.id} className={tableStyles.mobileSelectorCard}>
                      <div className={tableStyles.mobileCardHeader}>
                        <div className={tableStyles.mobileProfile}>
                          <div className={tableStyles.avatar}>
                            {getInitials(sel.user.fullName, sel.user.email)}
                          </div>
                          <div className={tableStyles.mobileInfo}>
                            <span className={tableStyles.name}>
                              {sel.user.fullName || sel.user.email}
                            </span>
                            <span className={tableStyles.email}>{sel.user.email}</span>
                          </div>
                        </div>

                        <div className={tableStyles.mobileBadges}>
                          <span
                            className={
                              sel.selectorType === "RH"
                                ? tableStyles.roleBadgeRh
                                : tableStyles.roleBadgeDev
                            }
                          >
                            {sel.selectorType === "RH" ? "RH" : "DEV"}
                          </span>
                        </div>
                      </div>

                      <div className={tableStyles.mobileProgressSection}>
                        <div className={tableStyles.mobileProgressHeader}>
                          <span className={tableStyles.mobileProgressLabel}>
                            Candidats évalués
                          </span>
                          <span className={tableStyles.reviewedNumber}>
                            {reviewed} / {assigned}
                          </span>
                        </div>
                        <div className={tableStyles.progressBarTrack}>
                          <div
                            className={`${tableStyles.progressBarFill} ${
                              reviewed >= assigned && assigned > 0
                                ? tableStyles.progressBarFillComplete
                                : ""
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className={tableStyles.mobileCardFooter}>
                        <span className={tableStyles.statusActive}>Actif</span>
                        <button
                          type="button"
                          className={tableStyles.omitButton}
                          onClick={() => setOmittingSelector(sel)}
                          title="Omettre ce sélecteur de l'événement"
                        >
                          Omettre
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

            {/* In-app Omit Confirmation Modal */}
            {omittingSelector && (
              <div
                className={tableStyles.confirmOverlay}
                onClick={() => !omitLoading && setOmittingSelector(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Confirmer l'omission du sélecteur"
              >
                <div
                  className={tableStyles.confirmModal}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={tableStyles.confirmHeader}>
                    <div className={tableStyles.confirmIconWarning}>⚠️</div>
                    <h2 className={tableStyles.confirmTitle}>
                      Omettre de l&apos;événement
                    </h2>
                  </div>

                  <p className={tableStyles.confirmMessage}>
                    Êtes-vous sûr de vouloir omettre{" "}
                    <strong>
                      {omittingSelector.user.fullName || omittingSelector.user.email}
                    </strong>{" "}
                    ({omittingSelector.user.email}) de cet événement ?
                  </p>

                  <div className={tableStyles.confirmWarningBox}>
                    Ce sélecteur sera retiré immédiatement de cet événement. Vous
                    pourrez toujours le rajouter plus tard via le bouton « ADD SELECTOR ».
                  </div>

                  <div className={tableStyles.confirmActions}>
                    <button
                      type="button"
                      className={tableStyles.cancelBtn}
                      onClick={() => setOmittingSelector(null)}
                      disabled={omitLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className={tableStyles.confirmBtnDanger}
                      onClick={handleConfirmOmit}
                      disabled={omitLoading}
                    >
                      {omitLoading ? "Retrait en cours..." : "Omettre de l'événement"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Selector Modal */}
            {showAddModal && (
              <AddSelectorModal
                eventId={eventId}
                existingSelectorUserIds={selectors.map((s) => s.user.id)}
                existingSelectorEmails={selectors.map((s) => s.user.email.toLowerCase())}
                onClose={() => setShowAddModal(false)}
                onSelectorAdded={() => {
                  setToastMessage("✓ Sélecteur ajouté avec succès.");
                  setRefreshKey((k) => k + 1);
                }}
              />
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
