"use client";

import { useEffect, useState } from "react";
import styles from "./AddUserModal.module.css";

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const roles = ["DEV", "Selector RH", "Selector Technique"];

const events = ["Event 1", "Event 2", "Event 3"];

export default function AddUserModal({
  isOpen,
  onClose,
}: AddUserModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [event, setEvent] = useState("");

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

  if (!shouldRender) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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

    if (
      (role === "Selector RH" || role === "Selector Technique") &&
      !event
    ) {
      alert("Veuillez sélectionner un événement.");
      return;
    }

    // Backend will be connected later.
    alert("Utilisateur prêt à être ajouté.");

    onClose();
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

            <select
              id="role"
              value={role}
              onChange={(e) => {
                const selectedRole = e.target.value;

                setRole(selectedRole);

                if (selectedRole === "DEV" || selectedRole === "") {
                  setEvent("");
                }
              }}
            >
              <option value="">Sélectionnez son role</option>

              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="event">
              choisissez l’événement du selecteur
            </label>

            <select
              id="event"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              disabled={role === "DEV" || role === ""}
            >
              <option value="">Sélectionnez un événement</option>

              {events.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.submitButton}>
            ajouter l'utilisateur
          </button>
        </form>
      </div>
    </div>
  );
}