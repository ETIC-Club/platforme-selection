"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import { ShieldIcon, UserCheckIcon, CodeIcon, ArrowRightIcon } from "@/components/Icons";
import { ASSETS } from "@/lib/theme";
import styles from "./login.module.css";

function LoginContent() {
  const { user, loginAs } = useAuth();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("from") || "/";

  const handleSelectRole = (role: UserRole) => {
    loginAs(role, returnUrl);
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCardContainer}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.logoArea}>
            <Image
              src={ASSETS.logo}
              alt="Club ETIC Logo"
              width={42}
              height={36}
              style={{ objectFit: "contain" }}
              priority
            />
            <span className={styles.brandTitle}>PLATFORM SELECTION</span>
          </div>

          <div className={styles.tempBadge}>
            <span>⚡ Mode Pré-Authentification</span>
          </div>

          <h1 className={styles.mainTitle}>Choisissez votre profil d'accès</h1>
          <p className={styles.subtitle}>
            Sélectionnez votre rôle pour entrer directement sur la plateforme sans saisir d'identifiants.
          </p>
        </div>

        {/* Temporary Notice Banner */}
        <div className={styles.noticeBanner}>
          <div style={{ fontSize: "20px", flexShrink: 0 }}>ℹ️</div>
          <p className={styles.noticeText}>
            <strong>Page de connexion temporaire :</strong> Aucun mot de passe n'est requis. Cliquez sur le rôle de votre choix pour simuler la session correspondante. Le module de connexion définitif et le backend seront intégrés ultérieurement.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className={styles.cardsGrid}>
          {/* Card 1: Admin */}
          <div
            className={`${styles.roleCard} ${styles.cardAdmin}`}
            onClick={() => handleSelectRole("SUPER_ADMIN")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSelectRole("SUPER_ADMIN");
            }}
          >
            <div>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconContainer} ${styles.iconAdmin}`}>
                  <ShieldIcon className="w-6 h-6" />
                </div>
                <span className={styles.cardBadge}>Accès Total</span>
              </div>

              <h2 className={styles.roleName}>Admin</h2>
              <p className={styles.roleSubtitle}>
                Supervision globale, gestion des événements, assignation des sélecteurs et logs.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Gestion des événements & paramètres</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Attribution et suivi des sélecteurs</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Accès aux journaux d'audit (Logs)</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Vue et gestion de toutes les candidatures</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRole("SUPER_ADMIN");
              }}
            >
              <span>Se connecter comme Admin</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Sélecteur RH */}
          <div
            className={`${styles.roleCard} ${styles.cardRh}`}
            onClick={() => handleSelectRole("SELECTOR_RH")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSelectRole("SELECTOR_RH");
            }}
          >
            <div>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconContainer} ${styles.iconRh}`}>
                  <UserCheckIcon className="w-6 h-6" />
                </div>
                <span className={styles.cardBadge}>Pôle RH</span>
              </div>

              <h2 className={styles.roleName}>Sélecteur RH</h2>
              <p className={styles.roleSubtitle}>
                Évaluation du profil, parcours, motivation et soft skills des candidats.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Consultation des dossiers candidats</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Visualisation des vidéos & stories</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Évaluations & annotations RH</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Validation & décisions RH</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRole("SELECTOR_RH");
              }}
            >
              <span>Se connecter comme Sélecteur RH</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Sélecteur Dev */}
          <div
            className={`${styles.roleCard} ${styles.cardDev}`}
            onClick={() => handleSelectRole("SELECTOR_TECHNIQUE")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSelectRole("SELECTOR_TECHNIQUE");
            }}
          >
            <div>
              <div className={styles.cardHeader}>
                <div className={`${styles.iconContainer} ${styles.iconDev}`}>
                  <CodeIcon className="w-6 h-6" />
                </div>
                <span className={styles.cardBadge}>Pôle Technique</span>
              </div>

              <h2 className={styles.roleName}>Sélecteur Dev</h2>
              <p className={styles.roleSubtitle}>
                Évaluation des compétences techniques, code, projets et logique de développement.
              </p>

              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Évaluation technique & compétences dev</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Revue des projets et liens GitHub</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Notation technique et feedbacks</span>
                </li>
                <li className={styles.featureItem}>
                  <span className={styles.checkDot} />
                  <span>Validation des critères techniques</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRole("SELECTOR_TECHNIQUE");
              }}
            >
              <span>Se connecter comme Sélecteur Dev</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Already logged in indicator */}
        {user && (
          <div className={styles.activeIndicatorBanner}>
            <span>
              Connecté actuellement : <strong>{user.name}</strong> ({user.roleTitle})
            </span>
            <Link href={returnUrl} className={styles.continueLink}>
              Continuer vers l'application →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <p>Chargement du portail...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
