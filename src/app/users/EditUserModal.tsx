"use client";

import { useEffect, useState } from "react";
import styles from "../admin/users/AddUserModal.module.css";

type User = {
  id: number;
  name: string;
  email: string;
  joined: string;
  events: number;
  candidates: number;
  role: string;
  roleType: string;
};

type Event = {
  id: number;
  name: string;
};

type EditUserModalProps = {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => Promise<void>;
};

const roles = ["Admin", "Sélecteur RH", "Sélecteur Dev"];

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onUserUpdated,
}: EditUserModalProps) {
  const [shouldRender, setShouldRender] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [event, setEvent] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setShouldRender(true);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setEvent("");
    } else if (!isOpen) {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;

    const loadEvents = async () => {
      try {
        setEventsLoading(true);

        const response = await fetch("/api/events");

        if (!response.ok) {
          throw new Error("Unable to load events.");
        }

        const data = await response.json();
        setEvents(data.events ?? []);
      } catch (error) {
        console.error("Error loading events:", error);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, [isOpen]);

  if (!shouldRender && !isOpen) {
    return null;
  }

  const isSelector =
    role === "Sélecteur RH" ||
    role === "Sélecteur Dev" ||
    role === "Selector RH" ||
    role === "Selector Technique";

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (!name.trim()) {
      alert("Veuillez entrer le nom.");
      return;
    }

    if (!email.trim()) {
      alert("Veuillez entrer l'adresse e-mail.");
      return;
    }

    if (isSelector && !event) {
      alert("Veuillez sélectionner un événement.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          name: name.trim(),
          email: email.trim(),
          role,
          event,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Impossible de modifier l'utilisateur.");
        return;
      }

      await onUserUpdated();
      onClose();
    } catch {
      alert(
        "Une erreur est survenue lors de la modification de l'utilisateur."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`${styles.overlay} ${
        isOpen ? styles.overlayOpen : styles.overlayClosing
      }`}
      onMouseDown={onClose}
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
        >
          ×
        </button>

        <h2>Modifier l&apos;utilisateur</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="editName">Nom complet</label>

            <input
              id="editName"
              type="text"
              placeholder="Entrez le nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="editEmail">Adresse e-mail</label>

            <div className={styles.inputWithIcon}>
              <span>✉</span>

              <input
                id="editEmail"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="editRole">Role</label>

            <select
              id="editRole"
              value={role}
              onChange={(e) => {
                const selectedRole = e.target.value;

                setRole(selectedRole);

                if (selectedRole === "Admin" || selectedRole === "DEV") {
                  setEvent("");
                }
              }}
              disabled={isSaving}
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {isSelector && (
            <div className={styles.field}>
              <label htmlFor="editEvent">
                Événement du sélecteur
              </label>

              <select
                id="editEvent"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                disabled={isSaving || eventsLoading}
              >
                <option value="">
                  {eventsLoading
                    ? "Chargement des événements..."
                    : "Sélectionnez un événement"}
                </option>

                {events.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSaving}
          >
            {isSaving
              ? "Modification..."
              : "modifier l'utilisateur"}
          </button>
        </form>
      </div>
    </div>
  );
}