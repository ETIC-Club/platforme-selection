"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./AddEventModal.module.css";

// ────────────────────────────────────────────────────────────────
// AddEventModal — Modal to create a new event via POST /api/events
//
// Matches the exact design system and mechanics of AddUserModal:
//   - Frosted backdrop & smooth scale-fade transition
//   - Responsive 2-column input rows
//   - Styled inputs, icon adornments, custom category dropdown
//   - Client-side validation & server error handling
// ────────────────────────────────────────────────────────────────

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const CATEGORY_OPTIONS = [
  { label: "Camp de recrutement / Camp", value: "CAMP" },
  { label: "Hackathon", value: "HACKATHON" },
  { label: "Formation", value: "FORMATION" },
  { label: "Événement général", value: "AUTRE" },
];

export function AddEventModal({
  isOpen,
  onClose,
  onEventCreated,
}: AddEventModalProps) {
  const [shouldRender, setShouldRender] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CAMP");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [quota, setQuota] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [nbEvalRh, setNbEvalRh] = useState("1");
  const [nbEvalTechnique, setNbEvalTechnique] = useState("1");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync rendering with isOpen for entry/exit animations (matches AddUserModal)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setError(null);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, isOpen, onClose]);

  // Click outside category dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!shouldRender && !isOpen) {
    return null;
  }

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
      setError("Le quota de participants doit être un nombre entier positif.");
      return;
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

    // Build payload matching POST /api/events API specification
    const body: Record<string, unknown> = {
      name: trimmedName,
      quotaParticipants: quotaNum,
      nbEvalRh: rhNum,
      nbEvalTechnique: techNum,
    };

    // Include description with optional category indicator if needed
    let finalDesc = description.trim();
    if (category && category !== "AUTRE") {
      const hasCategoryTag =
        finalDesc.toUpperCase().includes(category) ||
        trimmedName.toUpperCase().includes(category);
      if (!hasCategoryTag) {
        finalDesc = finalDesc ? `[${category}] ${finalDesc}` : `[${category}]`;
      }
    }
    if (finalDesc) {
      body.description = finalDesc;
    }

    if (googleSheetUrl.trim()) {
      body.googleSheetUrl = googleSheetUrl.trim();
    }

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

      // Reset form state
      setName("");
      setQuota("");
      setDescription("");
      setGoogleSheetUrl("");
      setNbEvalRh("1");
      setNbEvalTechnique("1");

      onEventCreated();
      onClose();
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === category)?.label ||
    "Sélectionnez le type";

  return (
    <div
      className={`${styles.overlay} ${
        isOpen ? styles.overlayOpen : styles.overlayClosing
      }`}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un événement"
    >
      <div
        className={`${styles.modal} ${
          isOpen ? styles.modalOpen : styles.modalClosing
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer"
          disabled={submitting}
        >
          ×
        </button>

        <h2>Ajouter un événement</h2>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Nom & Catégorie */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="eventName">Nom de l&apos;événement *</label>
              <input
                id="eventName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Training Camp XIV"
                required
                autoFocus
                disabled={submitting}
              />
            </div>

            <div className={styles.field} ref={dropdownRef}>
              <label htmlFor="eventCategory">Type d&apos;événement</label>
              <div className={styles.customSelect}>
                <button
                  id="eventCategory"
                  type="button"
                  className={styles.customSelectButton}
                  onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                  aria-expanded={categoryDropdownOpen}
                  disabled={submitting}
                >
                  <span>{selectedCategoryLabel}</span>
                  <span className={styles.customSelectArrow}>▼</span>
                </button>

                {categoryDropdownOpen && (
                  <div className={styles.customSelectOptions}>
                    {CATEGORY_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={styles.customSelectOption}
                        onClick={() => {
                          setCategory(item.value);
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Quota & Lien Google Sheet */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="eventQuota">Quota de participants *</label>
              <input
                id="eventQuota"
                type="number"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="Ex: 60"
                min="1"
                required
                disabled={submitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="eventSheet">Lien Google Sheet (Optionnel)</label>
              <div className={styles.inputWithIcon}>
                <span aria-hidden="true">🔗</span>
                <input
                  id="eventSheet"
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Évaluations RH & Techniques requises */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="nbEvalRh">Évaluations RH requises</label>
              <input
                id="nbEvalRh"
                type="number"
                value={nbEvalRh}
                onChange={(e) => setNbEvalRh(e.target.value)}
                placeholder="1"
                min="0"
                disabled={submitting}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="nbEvalTech">Évaluations Techniques requises</label>
              <input
                id="nbEvalTech"
                type="number"
                value={nbEvalTechnique}
                onChange={(e) => setNbEvalTechnique(e.target.value)}
                placeholder="1"
                min="0"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Row 4: Description */}
          <div className={styles.field}>
            <label htmlFor="eventDescription">Description (Optionnelle)</label>
            <textarea
              id="eventDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description brève de l'événement et objectifs..."
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                <span>Création de l&apos;événement...</span>
              </>
            ) : (
              <span>Ajouter l&apos;événement</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEventModal;
