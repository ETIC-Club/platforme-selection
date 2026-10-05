"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PlusIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import styles from "@/components/dashboard.module.css";
import selStyles from "@/app/selectors/selectors.module.css";

interface UserItem {
  id: number;
  email: string;
  fullName: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  _count: { eventSelectors: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === "SUPER_ADMIN";

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/users?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUsers(data.users || []);
            setTotal(data.total || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUsers();
    return () => { isMounted = false; };
  }, [refreshKey]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setAddError("L'email est requis.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          fullName: newName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Erreur lors de la création.");
        return;
      }
      setNewEmail("");
      setNewName("");
      setShowAddModal(false);
      setRefreshKey((k) => k + 1);
    } catch {
      setAddError("Erreur réseau.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (userId: number, email: string) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
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
    <DashboardLayout>
      {({ searchQuery }) => {
        if (!isAdmin) {
          return (
            <div className={styles.mainCard}>
              <div className={selStyles.emptyState}>
                <div className={selStyles.emptyTitle}>Accès réservé</div>
                <div className={selStyles.emptySubtitle}>
                  Seuls les administrateurs peuvent gérer les utilisateurs.
                </div>
              </div>
            </div>
          );
        }

        const filtered = users.filter((u) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            u.email.toLowerCase().includes(q) ||
            (u.fullName || "").toLowerCase().includes(q)
          );
        });

        return (
          <div className={styles.mainCard}>
            <div className={styles.mainHeader}>
              <h1 className={styles.pageTitle}>
                USERS ({loading ? "…" : total})
              </h1>
              <button
                type="button"
                className={styles.addEventBtn}
                onClick={() => {
                  setShowAddModal(true);
                  setAddError(null);
                }}
              >
                <PlusIcon />
                <span>ADD USER</span>
              </button>
            </div>

            <div className={styles.eventsList}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={selStyles.skeletonCard}>
                    <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonAvatar}`} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonText}`} style={{ width: "180px" }} />
                      <div className={`${selStyles.skeletonPulse} ${selStyles.skeletonText} ${selStyles.skeletonTextShort}`} />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className={selStyles.emptyState}>
                  <div className={selStyles.emptyTitle}>Aucun utilisateur</div>
                  <div className={selStyles.emptySubtitle}>
                    {searchQuery
                      ? "Aucun utilisateur ne correspond à votre recherche."
                      : "Ajoutez des utilisateurs avec le bouton ci-dessus."}
                  </div>
                </div>
              ) : (
                filtered.map((u) => (
                  <article key={u.id} className={styles.itemCard}>
                    <div className={styles.candProfile}>
                      <div className={selStyles.selectorAvatar}>
                        {getInitials(u.fullName, u.email)}
                      </div>
                      <div className={styles.candNameGroup}>
                        <span className={styles.candName}>
                          {u.fullName || u.email}
                        </span>
                        <span className={styles.candEmail}>{u.email}</span>
                      </div>
                    </div>

                    <span style={{ fontSize: "12px", color: "#8C8F8E" }}>
                      {u._count.eventSelectors} événement{u._count.eventSelectors !== 1 ? "s" : ""}
                    </span>

                    {u.isSuperAdmin && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          background: "rgba(74, 222, 128, 0.12)",
                          color: "var(--color-primary-green)",
                        }}
                      >
                        Admin
                      </span>
                    )}

                    <span style={{ fontSize: "12px", color: "#8C8F8E" }}>
                      {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(u.id, u.email)}
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
                      aria-label={`Supprimer ${u.email}`}
                    >
                      ✕ Supprimer
                    </button>
                  </article>
                ))
              )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
              <div
                className={selStyles.modalOverlay}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowAddModal(false);
                }}
                role="dialog"
                aria-modal="true"
              >
                <div className={selStyles.modalContent}>
                  <div className={selStyles.modalHeader}>
                    <h2 className={selStyles.modalTitle}>Nouvel utilisateur</h2>
                    <button
                      type="button"
                      className={selStyles.modalCloseBtn}
                      onClick={() => setShowAddModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <form className={selStyles.modalBody} onSubmit={handleAddUser}>
                    <label className={selStyles.fieldLabel}>
                      Email *
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="utilisateur@esi.dz"
                        className={selStyles.eventSelect}
                        required
                        autoFocus
                      />
                    </label>
                    <label className={selStyles.fieldLabel}>
                      Nom complet
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Prénom Nom"
                        className={selStyles.eventSelect}
                      />
                    </label>
                    {addError && (
                      <div
                        style={{
                          padding: "10px 14px",
                          backgroundColor: "rgba(193, 51, 63, 0.06)",
                          borderRadius: "10px",
                          border: "1px solid rgba(193, 51, 63, 0.15)",
                          color: "#7F1D1D",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                        role="alert"
                      >
                        {addError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className={selStyles.importButton}
                      disabled={adding}
                    >
                      {adding ? "Création..." : "Créer l'utilisateur"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </DashboardLayout>
  );
}
