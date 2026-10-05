"use client";

import { useEffect, useState } from "react";
import styles from "./AddUserModal.module.css";

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => Promise<void>;
};

type Event = {
  id: number;
  name: string;
};

const roles = ["Admin", "Sélecteur RH", "Sélecteur Dev"];

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const [shouldRender, setShouldRender] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [event, setEvent] = useState("");

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
setEvents(data.events);
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

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!firstName.trim()) {
      alert("Veuillez entrer le prénom.");
      return;
    }

    if (!lastName.trim()) {
      alert("Veuillez entrer le nom.");
      return;
    }

    if (!email.trim()) {
      alert("Veuillez entrer l'adresse e-mail.");
      return;
    }

    if (!role) {
      alert("Veuillez sélectionner un rôle.");
      return;
    }



    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role,
          event,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Impossible d'ajouter l'utilisateur.");
        return;
      }

      await onUserAdded();

      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("");
      setEvent("");

      onClose();
    } catch {
      alert("Une erreur est survenue lors de l'ajout de l'utilisateur.");
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

        <h2>Ajouter un utilisateur</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName">Prénom</label>

              <input
                id="firstName"
                type="text"
                placeholder="Entrez votre prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName">Nom</label>

              <input
                id="lastName"
                type="text"
                placeholder="Entrez le nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Adresse e-mail</label>

            <div className={styles.inputWithIcon}>
              <span>✉</span>

              <input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
  <label htmlFor="role">Role</label>

  <div className={styles.customSelect}>
    <button
      type="button"
      className={styles.customSelectButton}
      onClick={() =>
        setRoleDropdownOpen((prev) => !prev)
      }
      aria-expanded={roleDropdownOpen}
    >
      <span>
        {role || "Sélectionnez son role"}
      </span>

      <span className={styles.customSelectArrow}>
        ▼
      </span>
    </button>

    {roleDropdownOpen && (
      <div className={styles.customSelectOptions}>
        {roles.map((item) => (
          <button
            key={item}
            type="button"
            className={styles.customSelectOption}
            onClick={() => {
              setRole(item);
              setRoleDropdownOpen(false);

              if (
                item === "Admin" ||
                item === "DEV" ||
                item === ""
              ) {
                setEvent("");
                setEventDropdownOpen(false);
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>
    )}
  </div>
</div>

          {(role === "Sélecteur RH" || role === "Sélecteur Dev" || role === "Selector RH" || role === "Selector Technique") && (
            <div className={styles.field}>
              <label htmlFor="event">
                Choisissez l’événement du sélecteur (optionnel)
              </label>

              <div className={styles.customSelect}>
                <button
                  type="button"
                  className={styles.customSelectButton}
                  onClick={() => setEventDropdownOpen((prev) => !prev)}
                >
                  <span>
                    {eventsLoading
                      ? "Chargement des événements..."
                      : event || "Aucun événement (optionnel)"}
                  </span>

                  <span className={styles.customSelectArrow}>▼</span>
                </button>

                {eventDropdownOpen && (
        <div className={styles.customSelectOptions}>
          <button
            type="button"
            className={styles.customSelectOption}
            onClick={() => {
              setEvent("");
              setEventDropdownOpen(false);
            }}
          >
            Aucun événement (optionnel)
          </button>
          {events.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.customSelectOption}
              onClick={() => {
                setEvent(item.name);
                setEventDropdownOpen(false);
              }}
              title={item.name}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
  </div>
</div>
)}

          <button
            type="submit"
            className={styles.submitButton}
          >
            ajouter l&apos;utilisateur
          </button>
        </form>
      </div>
    </div>
  );
}