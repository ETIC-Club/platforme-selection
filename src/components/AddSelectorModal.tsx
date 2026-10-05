"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "../app/selectors/selectors.module.css";

// ────────────────────────────────────────────────────────────────
// AddSelectorModal — Add a selector to an event via
// POST /api/events/[id]/selectors
//
// The email field is a searchable combobox: as the admin types,
// it fetches matching users from /api/users?search=... and shows
// a dropdown. Selecting a user auto-fills email + fullName.
//
// When eventId is provided (inside an event page), it's used directly.
// When omitted (global /selectors page), the modal fetches available
// events and shows a dropdown so the admin picks which event.
// ────────────────────────────────────────────────────────────────

interface EventOption {
  id: number;
  name: string;
}

interface UserSuggestion {
  id: number;
  email: string;
  fullName: string | null;
}

interface AddSelectorModalProps {
  eventId?: number;
  onClose: () => void;
  onSelectorAdded: () => void;
}

export function AddSelectorModal({
  eventId: fixedEventId,
  onClose,
  onSelectorAdded,
}: AddSelectorModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectorType, setSelectorType] = useState<"RH" | "Technique">("RH");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(fixedEventId ?? null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(!fixedEventId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── User search combobox state ──────────────────────────────
  const [userQuery, setUserQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch events list when no fixed eventId
  useEffect(() => {
    if (fixedEventId) return;

    let isMounted = true;
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.events) {
            const eventList: EventOption[] = data.events.map(
              (ev: { id: number; name: string }) => ({
                id: ev.id,
                name: ev.name,
              }),
            );
            setEvents(eventList);
            if (eventList.length > 0) {
              setSelectedEventId(eventList[0].id);
            }
          }
        }
      } catch {
        // Events fail to load — user can still type an ID
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => { isMounted = false; };
  }, [fixedEventId]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  // Close dropdown when clicking outside the combobox
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !submitting) onClose();
  };

  // ── Fetch user suggestions (debounced) ──────────────────────
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(query.trim())}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        const users: UserSuggestion[] = (data.users || []).map(
          (u: { id: number; email: string; fullName: string | null }) => ({
            id: u.id,
            email: u.email,
            fullName: u.fullName,
          }),
        );
        setSuggestions(users);
        setShowDropdown(users.length > 0);
        setHighlightedIndex(-1);
      }
    } catch {
      // Silently fail — the admin can still type manually
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleUserQueryChange = (value: string) => {
    setUserQuery(value);
    setEmail(value);
    setSelectedUser(null);

    // Debounce API calls — 250ms delay
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 250);
  };

  const handleSelectUser = (user: UserSuggestion) => {
    setEmail(user.email);
    setFullName(user.fullName || "");
    setUserQuery(user.email);
    setSelectedUser(user);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  // ── Keyboard navigation inside the dropdown ─────────────────
  const handleComboKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // ── Get initials for avatar ─────────────────────────────────
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

  // ── Highlight matching text in suggestion ───────────────────
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: "var(--color-primary-teal)", fontWeight: 800 }}>
          {text.slice(idx, idx + query.length)}
        </strong>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEventId || selectedEventId <= 0) {
      setError("Veuillez sélectionner un événement.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("L'email est requis.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Format d'email invalide.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/selectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          fullName: fullName.trim() || undefined,
          selectorType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erreur serveur (${res.status}).`);
        return;
      }

      onSelectorAdded();
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
      aria-label="Ajouter un sélecteur"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ajouter un sélecteur</h2>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Fermer"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          {/* Event picker — only shown when no fixed eventId */}
          {!fixedEventId && (
            <label className={styles.fieldLabel}>
              Événement *
              {loadingEvents ? (
                <div style={{ fontSize: "13px", color: "#8C8F8E", padding: "10px 0" }}>
                  Chargement des événements...
                </div>
              ) : events.length === 0 ? (
                <div style={{ fontSize: "13px", color: "#8C8F8E", padding: "10px 0" }}>
                  Aucun événement trouvé. Créez-en un d&apos;abord.
                </div>
              ) : (
                <select
                  value={selectedEventId ?? ""}
                  onChange={(e) => setSelectedEventId(Number(e.target.value))}
                  className={styles.eventSelect}
                  required
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          {/* ── Searchable User Combobox ──────────────────────── */}
          <div className={styles.fieldLabel}>
            <span>Utilisateur *</span>
            <div className={styles.comboboxWrapper} ref={comboboxRef}>
              <div className={styles.comboboxInputRow}>
                {selectedUser && (
                  <div className={styles.comboboxSelectedAvatar}>
                    {getInitials(selectedUser.fullName, selectedUser.email)}
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={userQuery}
                  onChange={(e) => handleUserQueryChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0 && !selectedUser) {
                      setShowDropdown(true);
                    }
                  }}
                  onKeyDown={handleComboKeyDown}
                  placeholder="Rechercher par nom ou email..."
                  className={styles.eventSelect}
                  style={selectedUser ? { paddingLeft: "42px" } : undefined}
                  autoComplete="off"
                  autoFocus={!!fixedEventId}
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-autocomplete="list"
                  aria-controls="user-suggestions-list"
                />
                {loadingSuggestions && (
                  <div className={styles.comboboxSpinner}>
                    <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: "2px" }} />
                  </div>
                )}
                {selectedUser && (
                  <button
                    type="button"
                    className={styles.comboboxClearBtn}
                    onClick={() => {
                      setSelectedUser(null);
                      setUserQuery("");
                      setEmail("");
                      setFullName("");
                      setSuggestions([]);
                      setShowDropdown(false);
                      inputRef.current?.focus();
                    }}
                    aria-label="Effacer la sélection"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <ul
                  className={styles.comboboxDropdown}
                  id="user-suggestions-list"
                  role="listbox"
                >
                  {suggestions.map((user, idx) => (
                    <li
                      key={user.id}
                      className={`${styles.comboboxOption} ${
                        idx === highlightedIndex ? styles.comboboxOptionHighlighted : ""
                      }`}
                      onClick={() => handleSelectUser(user)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      role="option"
                      aria-selected={idx === highlightedIndex}
                    >
                      <div className={styles.comboboxOptionAvatar}>
                        {getInitials(user.fullName, user.email)}
                      </div>
                      <div className={styles.comboboxOptionInfo}>
                        <span className={styles.comboboxOptionName}>
                          {highlightMatch(user.fullName || user.email, userQuery)}
                        </span>
                        {user.fullName && (
                          <span className={styles.comboboxOptionEmail}>
                            {highlightMatch(user.email, userQuery)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p style={{ fontSize: "11px", color: "#8C8F8E", margin: 0 }}>
              Tapez pour rechercher parmi les utilisateurs existants.
            </p>
          </div>

          <label className={styles.fieldLabel}>
            Nom complet
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Prénom Nom (optionnel)"
              className={styles.eventSelect}
            />
          </label>

          <label className={styles.fieldLabel}>
            Type de sélecteur *
            <select
              value={selectorType}
              onChange={(e) => setSelectorType(e.target.value as "RH" | "Technique")}
              className={styles.eventSelect}
            >
              <option value="RH">RH</option>
              <option value="Technique">Technique (DEV)</option>
            </select>
          </label>

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

          <button
            type="submit"
            className={styles.importButton}
            disabled={submitting || loadingEvents || (!fixedEventId && events.length === 0)}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                Ajout en cours...
              </>
            ) : (
              "Ajouter le sélecteur"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
