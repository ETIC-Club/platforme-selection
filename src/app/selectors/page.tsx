"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddSelectorModal } from "@/components/AddSelectorModal";
import { ArrowRightIcon, ClockIcon, PlusIcon } from "@/components/Icons";
import type { SelectorViewModel } from "@/lib/types";
import dashStyles from "@/components/dashboard.module.css";
import styles from "./selectors.module.css";

// ────────────────────────────────────────────────────────────────
// /selectors — Global selectors page (outside event context)
//
// Why a top-level /selectors route: the Figma design shows this
// as a global admin page. Uses DashboardLayout (no eventContext)
// and the render-prop pattern { searchQuery, role } like every
// other page in the app.
// ────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "done" | "in_progress";
const ITEMS_PER_PAGE = 10;

export default function SelectorsPage() {
  const [selectors, setSelectors] = useState<SelectorViewModel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchSelectors = useCallback(
    async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
        });
        if (search.trim()) {
          params.set("search", search.trim());
        }

        const res = await fetch(`/api/selectors?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erreur ${res.status}`);
        }

        const data = await res.json();
        setSelectors(data.selectors ?? []);
        setTotal(data.total ?? 0);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur de chargement";
        setError(message);
        setSelectors([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, page],
  );

  const handleStatusFilterChange = useCallback((newFilter: StatusFilter) => {
    setStatusFilter(newFilter);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusLabel = (status: "termine" | "en_cours"): string => {
    return status === "termine" ? "Terminé" : "En cours";
  };

  return (
    <DashboardLayout>
      {({ searchQuery, role }) => {
        // Trigger fetch when searchQuery, filter, or page changes
        // We use useEffect inside the render-prop callback since
        // searchQuery is only available here
        return (
          <SelectorsContent
            searchQuery={searchQuery}
            role={role}
            selectors={selectors}
            total={total}
            totalPages={totalPages}
            loading={loading}
            error={error}
            statusFilter={statusFilter}
            page={page}
            showImportModal={showImportModal}
            fetchSelectors={fetchSelectors}
            setStatusFilter={handleStatusFilterChange}
            setPage={setPage}
            setShowImportModal={setShowImportModal}
            getInitials={getInitials}
            getStatusLabel={getStatusLabel}
          />
        );
      }}
    </DashboardLayout>
  );
}

// ────────────────────────────────────────────────────────────────
// Inner component that has access to searchQuery from the render prop
// ────────────────────────────────────────────────────────────────
interface SelectorsContentProps {
  searchQuery: string;
  role: string;
  selectors: SelectorViewModel[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  page: number;
  showImportModal: boolean;
  fetchSelectors: (search: string) => Promise<void>;
  setStatusFilter: (f: StatusFilter) => void;
  setPage: (p: number) => void;
  setShowImportModal: (v: boolean) => void;
  getInitials: (name: string) => string;
  getStatusLabel: (status: "termine" | "en_cours") => string;
}

function SelectorsContent({
  searchQuery,
  role,
  selectors,
  total,
  totalPages,
  loading,
  error,
  statusFilter,
  page,
  showImportModal,
  fetchSelectors,
  setStatusFilter,
  setPage,
  setShowImportModal,
  getInitials,
  getStatusLabel,
}: SelectorsContentProps) {
  // Fetch on mount and whenever dependencies change
  useEffect(() => {
    fetchSelectors(searchQuery);
  }, [fetchSelectors, searchQuery]);

  const isAdmin = role === "SUPER_ADMIN";

  // Gate: only SUPER_ADMIN can access selectors
  if (!isAdmin) {
    return (
      <div className={dashStyles.mainCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Accès réservé</div>
          <div className={styles.emptySubtitle}>
            Seuls les administrateurs peuvent voir les sélecteurs.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={dashStyles.mainCard}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Selecteur</h1>

        <div className={styles.headerActions}>
          <select
            className={styles.filterDropdown}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filtrer par statut"
          >
            <option value="all">All</option>
            <option value="done">Terminé</option>
            <option value="in_progress">En cours</option>
          </select>

          {isAdmin && (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setShowImportModal(true)}
              aria-label="Ajouter un sélecteur"
            >
              <PlusIcon />
              ADD SELECTOR
            </button>
          )}
        </div>
      </div>

      {/* ── Selector Cards ─────────────────────────────────────── */}
      <div className={styles.selectorsList}>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div
                className={`${styles.skeletonPulse} ${styles.skeletonAvatar}`}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  className={`${styles.skeletonPulse} ${styles.skeletonText}`}
                  style={{ width: "140px" }}
                />
                <div
                  className={`${styles.skeletonPulse} ${styles.skeletonText} ${styles.skeletonTextShort}`}
                />
              </div>
              <div
                className={`${styles.skeletonPulse} ${styles.skeletonBadge}`}
              />
              <div style={{ flex: 1.2, maxWidth: "240px" }}>
                <div
                  className={`${styles.skeletonPulse} ${styles.skeletonProgress}`}
                />
              </div>
              <div
                className={`${styles.skeletonPulse} ${styles.skeletonBadge}`}
              />
              <div
                className={`${styles.skeletonPulse} ${styles.skeletonCircle}`}
              />
            </div>
          ))
        ) : error ? (
          // Error state
          <div className={styles.errorState}>
            <div className={styles.errorTitle}>Erreur de chargement</div>
            <div className={styles.emptySubtitle}>{error}</div>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => fetchSelectors(searchQuery)}
              aria-label="Réessayer le chargement"
            >
              Réessayer
            </button>
          </div>
        ) : selectors.length === 0 ? (
          // Empty state
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>Aucun sélecteur trouvé</div>
            <div className={styles.emptySubtitle}>
              {searchQuery
                ? "Aucun sélecteur ne correspond à votre recherche."
                : statusFilter !== "all"
                  ? "Aucun sélecteur avec ce statut."
                  : "Aucun sélecteur n'a été assigné pour le moment."}
            </div>
          </div>
        ) : (
          // Selector cards
          selectors.map((selector) => (
            <article
              key={selector.id}
              className={styles.selectorCard}
              aria-label={`Sélecteur ${selector.name}`}
            >
              {/* Avatar */}
              <div className={styles.selectorAvatar}>
                {getInitials(selector.name)}
              </div>

              {/* Name & Email */}
              <div className={styles.selectorInfo}>
                <span className={styles.selectorName}>{selector.name}</span>
                <span className={styles.selectorEmail}>{selector.email}</span>
              </div>

              {/* Role Badge */}
              <span
                className={`${styles.roleBadge} ${
                  selector.roleType === "RH"
                    ? styles.roleBadgeRH
                    : styles.roleBadgeTechnique
                }`}
              >
                {selector.roleType === "RH" ? "RH" : "DEV"}
              </span>

              {/* Progress */}
              <div className={styles.progressSection}>
                <span className={styles.progressLabel}>
                  {selector.selected}/{selector.total}
                </span>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${Math.max(selector.progressPercent, 0)}%` }}
                  >
                    {selector.progressPercent >= 15 && (
                      <span className={styles.progressPercent}>
                        {selector.progressPercent}%
                      </span>
                    )}
                  </div>
                  {selector.progressPercent < 15 && (
                    <span
                      className={styles.progressPercentOutside}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      {selector.progressPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`${styles.statusBadge} ${
                  selector.status === "termine"
                    ? styles.statusTermine
                    : styles.statusEnCours
                }`}
              >
                {selector.status === "en_cours" && <ClockIcon />}
                {selector.status === "termine" && "✓ "}
                {getStatusLabel(selector.status)}
              </span>

              {/* Arrow Button */}
              <Link
                href={`/selectors/${selector.id}`}
                className={styles.arrowButton}
                aria-label={`Voir les détails de ${selector.name}`}
              >
                <ArrowRightIcon />
              </Link>
            </article>
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!loading && !error && total > ITEMS_PER_PAGE && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Page précédente"
          >
            ← Préc.
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, and 2 around current
              return (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1
              );
            })
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className={styles.pageInfo}>…</span>
                )}
                <button
                  type="button"
                  className={`${styles.pageButton} ${p === page ? styles.pageButtonActive : ""}`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}

          <button
            type="button"
            className={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Page suivante"
          >
            Suiv. →
          </button>
        </div>
      )}

      {/* ── Add Selector Modal ──────────────────────────────────── */}
      {showImportModal && (
        <AddSelectorModal
          onClose={() => setShowImportModal(false)}
          onSelectorAdded={() => {
            fetchSelectors(searchQuery);
          }}
        />
      )}
    </div>
  );
}
