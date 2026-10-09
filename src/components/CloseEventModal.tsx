"use client";

import React, { useState } from "react";
import { LockIcon, DownloadIcon, CheckCircleIcon } from "./Icons";
import styles from "./CloseEventModal.module.css";

interface CloseEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventName: string;
}

export function CloseEventModal({
  isOpen,
  onClose,
  eventId,
  eventName,
}: CloseEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [exportStats, setExportStats] = useState<{
    acceptedCount: number;
    totalExported: number;
    fileName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCloseEvent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la clôture de l'événement.");
      }

      const data = await response.json();

      // Trigger automatic browser download of the CSV
      if (data.csvContent) {
        const blob = new Blob([data.csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", data.fileName || `candidats_acceptes_event_${eventId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setExportStats({
        acceptedCount: data.acceptedCount ?? 0,
        totalExported: data.totalExported ?? 0,
        fileName: data.fileName,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error("Error closing event:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la clôture de l'événement."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
    if (typeof window !== "undefined") {
      window.location.href = "/history";
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-event-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!isSuccess ? (
          <>
            <div className={styles.headerIcon}>
              <LockIcon width={24} height={24} />
            </div>

            <h2 id="close-event-title" className={styles.title}>
              Clôturer l&apos;événement
            </h2>

            <p className={styles.description}>
              Êtes-vous sûr de vouloir clôturer définitivement{" "}
              <strong>{eventName}</strong> ?
            </p>

            <div className={styles.infoBox}>
              <div className={styles.infoTitle}>
                <DownloadIcon width={16} height={16} />
                <span>Export automatique des résultats</span>
              </div>
              <p className={styles.infoText}>
                La clôture génère et télécharge instantanément un fichier{" "}
                <strong>.CSV</strong> contenant la liste de tous les{" "}
                <strong>candidats acceptés</strong> avec leurs coordonnées complètes
                (Prénom, Nom, Email, Téléphone, Compétences et Évaluations).
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </button>

              <button
                type="button"
                className={styles.confirmBtn}
                onClick={handleCloseEvent}
                disabled={loading}
              >
                {loading ? (
                  <span>Exportation en cours...</span>
                ) : (
                  <>
                    <DownloadIcon width={16} height={16} />
                    <span>Clôturer & Exporter le CSV</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckCircleIcon width={32} height={32} />
            </div>

            <h2 className={styles.title}>Événement clôturé avec succès !</h2>

            <p className={styles.description}>
              L&apos;événement a été clôturé et transféré dans la colonne de
              l&apos;<strong>Historique</strong>. Le fichier CSV contenant
              exclusivement les candidats acceptés a été téléchargé.
            </p>

            {exportStats && (
              <div className={styles.statsCard}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Candidats admis exportés</span>
                  <span className={styles.statValue}>
                    {exportStats.acceptedCount}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Nouveau statut</span>
                  <span className={styles.statValue} style={{ color: "#d97706" }}>
                    Clôturé (Historique)
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Fichier généré</span>
                  <span className={styles.statFileName}>
                    {exportStats.fileName}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.finishBtn}
                onClick={handleFinish}
              >
                Voir dans l&apos;Historique →
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") {
                    window.location.href = "/";
                  }
                }}
              >
                Retour aux Événements
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
