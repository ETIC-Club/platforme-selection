"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import styles from "./AddSelectorModal.module.css";

// ────────────────────────────────────────────────────────────────
// AddSelectorModal — Add a selector to an event via
// POST /api/events/[id]/selectors
//
// Clean, streamlined flow:
//   - Filter by type: Tous (DEV & RH), DEV, RH
//   - Search by name OR by email
//   - Automatically excludes users already assigned to this event
//   - Automatically maps selector role (RH or Technique) from user
// ────────────────────────────────────────────────────────────────

interface EventOption {
  id: number;
  name: string;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  role: string;
  roleType: string;
}

interface AddSelectorModalProps {
  eventId?: number;
  existingSelectorUserIds?: number[];
  existingSelectorEmails?: string[];
  onClose: () => void;
  onSelectorAdded: () => void;
}

type RoleFilter = "all" | "dev" | "rh";

export function AddSelectorModal({
  eventId: fixedEventId,
  existingSelectorUserIds = [],
  existingSelectorEmails = [],
  onClose,
  onSelectorAdded,
}: AddSelectorModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(fixedEventId ?? null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(!fixedEventId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── User search & filter state ──────────────────────────────
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [targetCandidates, setTargetCandidates] = useState<string>("20");

  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitting, onClose]);

  // Click outside combobox to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch events if not provided (global /selectors mode)
  useEffect(() => {
    if (fixedEventId) return;

    let isMounted = true;
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.events) {
            const list: EventOption[] = data.events.map((e: { id: number; name: string }) => ({
              id: e.id,
              name: e.name,
            }));
            setEvents(list);
            if (list.length > 0 && selectedEventId === null) {
              setSelectedEventId(list[0].id);
            }
          }
        }
      } catch {
        // silently handle
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => { isMounted = false; };
  }, [fixedEventId, selectedEventId]);

  // Pre-load all available users on modal open for instant filtering
  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          const list: UserOption[] = Array.isArray(data)
            ? data
            : (data.users || []);
          if (isMounted) {
            setAllUsers(list);
          }
        }
      } catch {
        // silently fallback
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    }

    loadUsers();
    return () => { isMounted = false; };
  }, []);

  // Normalized list of existing selector emails for fast lookup
  const normalizedExistingEmails = useMemo(() => {
    return new Set(existingSelectorEmails.map((e) => e.toLowerCase().trim()));
  }, [existingSelectorEmails]);

  const existingUserIdsSet = useMemo(() => {
    return new Set(existingSelectorUserIds);
  }, [existingSelectorUserIds]);

  // Filter users: exclude existing selectors in this event + apply role & search query
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allUsers.filter((u) => {
      // 1. DO NOT DISPLAY people that are already in the event
      if (existingUserIdsSet.has(u.id)) return false;
      if (normalizedExistingEmails.has(u.email.toLowerCase().trim())) return false;

      // 2. Role filter check (All, DEV, RH)
      if (roleFilter === "dev") {
        const isDev = u.roleType === "selector_dev" || u.role.toLowerCase().includes("dev");
        if (!isDev) return false;
      } else if (roleFilter === "rh") {
        const isRh = u.roleType === "selector_rh" || u.role.toLowerCase().includes("rh");
        if (!isRh) return false;
      }

      // 3. Search query check (matches name OR email)
      if (!q) return true;
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      return matchName || matchEmail;
    });
  }, [allUsers, existingUserIdsSet, normalizedExistingEmails, roleFilter, searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSelectedUser(null);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleSelectUser = (user: UserOption) => {
    setSelectedUser(user);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleClearSelected = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleComboKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(filteredUsers[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !submitting) onClose();
  };

  const getInitials = (name: string | null, em: string): string => {
    const src = name || em;
    return src
      .split(/[\s@]/)
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const highlightMatch = (text: string, q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return text;
    const idx = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: "#0bb29e" }}>
          {text.slice(idx, idx + trimmed.length)}
        </strong>
        {text.slice(idx + trimmed.length)}
      </>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEventId = fixedEventId ?? selectedEventId;
    if (!targetEventId) {
      setError("Veuillez sélectionner un événement.");
      return;
    }

    if (!selectedUser) {
      setError("Veuillez sélectionner un utilisateur dans la liste.");
      return;
    }

    // Automatically derive selector type from user role:
    const isRh =
      selectedUser.roleType === "selector_rh" ||
      selectedUser.role.toLowerCase().includes("rh");
    const derivedSelectorType: "RH" | "Technique" = isRh ? "RH" : "Technique";

    const quota = parseInt(targetCandidates, 10);
    if (isNaN(quota) || quota <= 0) {
      setError("Veuillez saisir un nombre valide de candidats à évaluer (minimum 1).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${targetEventId}/selectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          fullName: selectedUser.name || undefined,
          selectorType: derivedSelectorType,
          targetCandidates: quota,
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

  const selectedIsRh =
    selectedUser &&
    (selectedUser.roleType === "selector_rh" ||
      selectedUser.role.toLowerCase().includes("rh"));

  return (
    <div
      className={`${styles.overlay} ${styles.overlayOpen}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un sélecteur"
    >
      <div
        className={`${styles.modal} ${styles.modalOpen}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer"
          disabled={submitting}
        >
          ✕
        </button>

        <h2>Ajouter un sélecteur</h2>

        <form onSubmit={handleSubmit}>
          {/* Event picker — only shown when no fixed eventId */}
          {!fixedEventId && (
            <div className={styles.field}>
              <label>Événement *</label>
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
                  required
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* ── Type Filter Pills: All / DEV / RH ──────────────── */}
          <div className={styles.field}>
            <label>Filtrer par type</label>
            <div className={styles.roleFilterRow}>
              <button
                type="button"
                className={`${styles.filterPill} ${
                  roleFilter === "all" ? styles.filterPillActive : ""
                }`}
                onClick={() => {
                  setRoleFilter("all");
                  setShowDropdown(true);
                }}
              >
                Tous (DEV & RH)
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${
                  roleFilter === "dev" ? styles.filterPillActive : ""
                }`}
                onClick={() => {
                  setRoleFilter("dev");
                  setShowDropdown(true);
                }}
              >
                DEV
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${
                  roleFilter === "rh" ? styles.filterPillActive : ""
                }`}
                onClick={() => {
                  setRoleFilter("rh");
                  setShowDropdown(true);
                }}
              >
                RH
              </button>
            </div>
          </div>

          {/* ── Searchable Combobox: By Name or Email ──────────── */}
          <div className={styles.field}>
            <label>Rechercher un utilisateur (par nom ou email) *</label>
            <div className={styles.comboboxWrapper} ref={comboboxRef}>
              <div className={styles.comboboxInputRow}>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleComboKeyDown}
                  placeholder="Tapez un nom ou un email..."
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showDropdown}
                  aria-autocomplete="list"
                  disabled={!!selectedUser}
                />
                {loadingUsers && (
                  <div className={styles.comboboxSpinner}>
                    <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: "2px" }} />
                  </div>
                )}
                {searchQuery && !selectedUser && (
                  <button
                    type="button"
                    className={styles.comboboxClearBtn}
                    onClick={() => {
                      setSearchQuery("");
                      setShowDropdown(false);
                      inputRef.current?.focus();
                    }}
                    aria-label="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && !selectedUser && filteredUsers.length > 0 && (
                <ul className={styles.comboboxDropdown} role="listbox">
                  {filteredUsers.map((user, idx) => {
                    const isRh =
                      user.roleType === "selector_rh" ||
                      user.role.toLowerCase().includes("rh");
                    const isAdmin = user.role === "Admin";

                    return (
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
                          {getInitials(user.name, user.email)}
                        </div>
                        <div className={styles.comboboxOptionInfo}>
                          <span className={styles.comboboxOptionName}>
                            {highlightMatch(user.name || user.email, searchQuery)}
                          </span>
                          {user.name && (
                            <span className={styles.comboboxOptionEmail}>
                              {highlightMatch(user.email, searchQuery)}
                            </span>
                          )}
                        </div>

                        <span
                          className={`${styles.optionRoleBadge} ${
                            isAdmin
                              ? styles.optionRoleAdmin
                              : isRh
                              ? styles.optionRoleRh
                              : styles.optionRoleDev
                          }`}
                        >
                          {isAdmin ? "Admin" : isRh ? "RH" : "DEV"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {showDropdown && !selectedUser && filteredUsers.length === 0 && !loadingUsers && (
                <div
                  className={styles.comboboxDropdown}
                  style={{ padding: "14px 16px", color: "#6b7280", fontSize: "13px" }}
                >
                  {searchQuery
                    ? "Aucun utilisateur disponible trouvé."
                    : "Tous les utilisateurs de ce type sont déjà ajoutés à cet événement."}
                </div>
              )}
            </div>
          </div>

          {/* Selected User Preview Card */}
          {selectedUser && (
            <div className={styles.selectedUserCard}>
              <div className={styles.comboboxOptionAvatar}>
                {getInitials(selectedUser.name, selectedUser.email)}
              </div>
              <div className={styles.selectedUserInfo}>
                <span className={styles.selectedUserName}>
                  {selectedUser.name || selectedUser.email}
                </span>
                <span className={styles.selectedUserEmail}>
                  {selectedUser.email}
                </span>
              </div>
              <span
                className={`${styles.optionRoleBadge} ${
                  selectedIsRh ? styles.optionRoleRh : styles.optionRoleDev
                }`}
              >
                {selectedIsRh ? "RH" : "DEV"}
              </span>
              <button
                type="button"
                className={styles.unselectBtn}
                onClick={handleClearSelected}
                title="Changer d'utilisateur"
                aria-label="Changer d'utilisateur"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Nombre de candidats à évaluer (Quota) ──────────── */}
          <div className={styles.field}>
            <label htmlFor="targetCandidatesInput">
              Nombre de candidats à évaluer *
            </label>
            <input
              id="targetCandidatesInput"
              type="number"
              min={1}
              max={9999}
              value={targetCandidates}
              onChange={(e) => setTargetCandidates(e.target.value)}
              placeholder="Ex: 20"
              required
              disabled={submitting}
            />
            <span className={styles.fieldHelper}>
              Nombre de candidats que ce sélecteur devra évaluer pour cet événement.
            </span>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting || !selectedUser}
          >
            {submitting ? (
              <>
                <span className={styles.spinner} />
                <span>Ajout en cours...</span>
              </>
            ) : selectedUser ? (
              <span>Ajouter {selectedUser.name || selectedUser.email}</span>
            ) : (
              <span>Sélectionnez un utilisateur</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddSelectorModal;
