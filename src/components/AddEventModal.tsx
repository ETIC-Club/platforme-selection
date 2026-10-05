"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "../app/selectors/selectors.module.css";

// ────────────────────────────────────────────────────────────────
// AddEventModal — Modal to create a new event via POST /api/events
//
// Reuses the modal styling pattern from CsvImportModal / selectors.
// Fields map 1:1 to what the POST /api/events endpoint accepts:
//   required: name, quotaParticipants
//   optional: description, nbEvalRh, nbEvalTechnique
// ────────────────────────────────────────────────────────────────

interface AddEventModalProps {
  onClose: () => void;
  onEventCreated: () => void;
}

export function AddEventModal({ onClose, onEventCreated }: AddEventModalProps) {
  const [name, setName] = useState("");
  const [quota, setQuota] = useState("");
  const [description, setDescription] = useState("");
  const [nbEvalRh, setNbEvalRh] = useState("");
  const [nbEvalTechnique, setNbEvalTechnique] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !submitting) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ── Client-side validation ──
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom de l'événement est requis.");
      return;
    }

    const quotaNum = Number(quota);
    if (!quota || !Number.isInteger(quotaNum) || quotaNum <= 0) {
      setError("Le quota de participants doit être un entier positif.");
      return;
    }

    const body: Record<string, unknown> = {
      name: trimmedName,
      quotaParticipants: quotaNum,
    };

    if (description.trim()) {
      body.description = description.trim();
    }

    const rhNum = nbEvalRh ? Number(nbEvalRh) : 0;
    const techNum = nbEvalTechnique ? Number(nbEvalTechnique) : 0;

    if (nbEvalRh && (!Number.isInteger(rhNum) || rhNum < 0)) {
      setError("Le nombre d'évaluations RH doit être un entier positif ou zéro.");
      return;
    }
    if (nbEvalTechnique && (!Number.isInteger(techNum) || techNum < 0)) {
      setError("Le nombre d'évaluations techniques doit être un entier positif ou zéro.");
      return;
    }

    if (rhNum > 0) body.nbEvalRh = rhNum;
    if (techNum > 0) body.nbEvalTechnique = techNum;

    // ── Submit to backend ──
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Erreur serveur (${res.status}).`);
        return;
      }

      onEventCreated();
      onClose();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Créer un nouvel événement"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nouvel événement</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Fermer la modale"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          {/* Name (required) */}
          <label className={styles.fieldLabel}>
            Nom de l&apos;événement *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hackathon ETIC 2026"
              className={styles.eventSelect}
              required
              autoFocus
            />
          </label>

          {/* Quota (required) */}
          <label className={styles.fieldLabel}>
            Quota de participants *
            <input
              type="number"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="Ex: 30"
              className={styles.eventSelect}
              min="1"
              required
            />
          </label>

          {/* Description (optional) */}
          <label className={styles.fieldLabel}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'événement (optionnel)"
              className={styles.eventSelect}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </label>

          {/* Eval counts row */}
          <div style={{ display: "flex", gap: "12px" }}>
            <label className={styles.fieldLabel} style={{ flex: 1 }}>
              Évaluations RH
              <input
                type="number"
                value={nbEvalRh}
                onChange={(e) => setNbEvalRh(e.target.value)}
                placeholder="0"
                className={styles.eventSelect}
                min="0"
              />
            </label>
            <label className={styles.fieldLabel} style={{ flex: 1 }}>
              Évaluations Techniques
              <input
                type="number"
                value={nbEvalTechnique}
                onChange={(e) => setNbEvalTechnique(e.target.value)}
                placeholder="0"
                className={styles.eventSelect}
                min="0"
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "rgba(193, 51, 63, 0.06)",
                borderRadius: "10px",
                border: "1px solid rgba(193, 51, 63, 0.15)",
                color: "#7F1D1D",
                fontSize: "13px",
                fontWeight: 600,
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={styles.importButton}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                Création en cours...
              </>
            ) : (
              "Créer l'événement"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
