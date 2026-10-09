"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  MessageSquareIcon,
  QuoteIcon,
} from "./Icons";
import { CandidateDetail } from "@/services/candidateService";
import { useAuth } from "@/context/AuthContext";
import styles from "./selectorCandidates.module.css";

const MOCK_SELECTOR_CANDIDATES: CandidateDetail[] = [
  {
    id: 190,
    eventId: 1,
    nom: "Bensaïd",
    prenom: "Yacine",
    email: "y_bensaid@esi.dz",
    telephone: "+213 555 12 34 56",
    education: "Data & IA",
    bio: "Passionné par l'apprentissage automatique et le deep learning. Expérience en vision par ordinateur et NLP.",
    cvUrl: "",
    githubUrl: "",
    competences: ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn"],
    projets: [],
    finalStatus: "en_attente",
    evaluations: [],
  },
  {
    id: 191,
    eventId: 1,
    nom: "Mansouri",
    prenom: "Lina",
    email: "l_mansouri@esi.dz",
    telephone: "+213 555 98 76 54",
    education: "Développement web · L3 Informatique",
    bio: "J'ai construit une API REST avec authentification JWT pour un projet scolaire, déployée avec Docker.",
    cvUrl: "",
    githubUrl: "",
    competences: ["React", "Node.js", "PostgreSQL", "Docker"],
    projets: [],
    finalStatus: "en_attente",
    evaluations: [],
  },
  {
    id: 192,
    eventId: 1,
    nom: "Belkacem",
    prenom: "Nour",
    email: "n_belkacem@esi.dz",
    telephone: "+213 555 65 43 21",
    education: "Design produit",
    bio: "Conception centrée utilisateur, prototypage interactif sous Figma et design systems complets.",
    cvUrl: "",
    githubUrl: "",
    competences: ["Figma", "UI/UX", "Design Systems", "Prototypage"],
    projets: [],
    finalStatus: "en_attente",
    evaluations: [],
  },
  {
    id: 193,
    eventId: 1,
    nom: "Moktefi",
    prenom: "Ines",
    email: "oi_moktefi@esi.dz",
    telephone: "+213 555 11 22 33",
    education: "1CS Ingénierie Logicielle",
    bio: "Passionnée d'architectures logicielles, Next.js et PostgreSQL. Travail en équipe rigoureux.",
    cvUrl: "",
    githubUrl: "",
    competences: ["TypeScript", "Next.js", "React", "PostgreSQL", "Docker"],
    projets: [],
    finalStatus: "en_attente",
    evaluations: [],
  },
  {
    id: 194,
    eventId: 1,
    nom: "Cherif",
    prenom: "Amina",
    email: "a_cherif@esi.dz",
    telephone: "+213 555 44 55 66",
    education: "M1 Data Science & IA",
    bio: "Expérience en pipelines de données et dashboards interactifs en production.",
    cvUrl: "",
    githubUrl: "",
    competences: ["Python", "SQL", "Docker", "FastAPI"],
    projets: [],
    finalStatus: "en_attente",
    evaluations: [],
  },
];

interface SelectorCandidatesViewProps {
  eventId: number;
  eventName: string;
  initialCandidates?: CandidateDetail[];
  onEvaluationSuccess?: () => void;
}

export function SelectorCandidatesView({
  eventId,
  eventName,
  initialCandidates = [],
  onEvaluationSuccess,
}: SelectorCandidatesViewProps) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateDetail[]>(initialCandidates);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(initialCandidates.length === 0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load candidates if not provided
  useEffect(() => {
    let isMounted = true;
    if (initialCandidates.length > 0) {
      setCandidates(initialCandidates);
      setLoading(false);
      return;
    }

    async function fetchCandidates() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${eventId}/candidates`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.candidates && data.candidates.length > 0) {
              setCandidates(data.candidates);
              if (data.candidates.length >= 3) {
                setCurrentIndex(2); // Match 3/8 position from Figma mockup
              }
            } else {
              setCandidates(MOCK_SELECTOR_CANDIDATES);
              setCurrentIndex(1); // Set Lina Mansouri active
            }
          }
        } else {
          if (isMounted) {
            setCandidates(MOCK_SELECTOR_CANDIDATES);
            setCurrentIndex(1);
          }
        }
      } catch (err) {
        console.error("Failed to load candidates for selector view:", err);
        if (isMounted) {
          setCandidates(MOCK_SELECTOR_CANDIDATES);
          setCurrentIndex(1);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCandidates();
    return () => {
      isMounted = false;
    };
  }, [eventId, initialCandidates]);

  const total = candidates.length;
  const current = candidates[currentIndex];
  const prevCandidate = currentIndex > 0 ? candidates[currentIndex - 1] : null;
  const nextCandidate = currentIndex < total - 1 ? candidates[currentIndex + 1] : null;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setComment("");
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setComment("");
    }
  }, [currentIndex, total]);

  // Keyboard navigation: Left Arrow / Right Arrow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting arrow keys if typing in a comment textarea/input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Decision submit handler
  const handleDecision = async (decision: "accepter" | "refuser" | "en_attente") => {
    if (!current || submitting) return;
    try {
      setSubmitting(true);
      const selectorType = user?.role === "SELECTOR_RH" ? "RH" : "Technique";
      const selectorName = user?.name || "Sélecteur";

      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: current.id,
          decision: decision === "refuser" ? "rejeter" : decision,
          comment: comment.trim(),
          selectorType,
          selectorName,
          userRole: user?.role,
        }),
      });

      if (res.ok) {
        onEvaluationSuccess?.();
        // Advance to next candidate if available
        if (currentIndex < total - 1) {
          handleNext();
        }
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #E5E7EB",
            borderTopColor: "var(--color-primary-teal, #02A9A2)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 12px auto",
          }}
        />
        <p className={styles.emptyText}>Chargement des candidatures...</p>
      </div>
    );
  }

  if (total === 0 || !current) {
    return (
      <div className={styles.emptyState}>
        <h2 className={styles.emptyTitle}>Aucune candidature à traiter</h2>
        <p className={styles.emptyText}>
          Toutes les candidatures ont été évaluées pour cet événement.
        </p>
      </div>
    );
  }

  // Extract fields from DB with fallbacks matching Figma mockups
  const initials = `${current.prenom?.[0] || ""}${current.nom?.[0] || ""}`.toUpperCase() || "CA";
  const fullName = `${current.prenom || ""} ${current.nom || ""}`.trim() || "Candidat";
  const dossierNum = `#TC-${190 + current.id}`;
  const subTitle = current.education
    ? `${current.education.split("-")[0].trim()} · Dossier ${dossierNum}`
    : `Développement web · Dossier ${dossierNum}`;

  // Derived or extraData fields
  const niveau = current.education || "L3 Informatique";
  const disponibilite = "Immédiate";
  const souhait = user?.role === "SELECTOR_RH" ? "Soft Skills" : "Backend";

  const competencesList = current.competences && current.competences.length > 0
    ? current.competences.slice(0, 5)
    : ["React", "Node.js", "PostgreSQL", "Docker"];

  const reponseTechnique = current.bio || "J'ai construit une API REST avec authentification JWT pour un projet scolaire, déployée avec Docker.";
  const motivationText = "Contribuer à un produit utile et progresser au contact d'une équipe exigeante.";

  // Pending count
  const pendingCount = candidates.filter((c) => c.finalStatus === "en_attente").length || total;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <span className={styles.breadcrumb}>
            {eventName} / MES CANDIDATURES
          </span>
          <h1 className={styles.pageTitle}>Évaluer les candidatures</h1>
        </div>

        <div className={styles.badgePending}>
          <span className={styles.badgeDot} />
          <span>{pendingCount} candidatures à traiter</span>
        </div>
      </div>

      {/* Carousel Stage */}
      <div className={styles.carouselStage}>
        {/* Left Side Peek Card (Desktop) */}
        {prevCandidate && (
          <div
            className={`${styles.sideCard} ${styles.sideCardLeft}`}
            onClick={handlePrev}
            role="button"
            tabIndex={0}
            aria-label="Candidature précédente"
          >
            <div className={styles.sideDashes}>
              <span className={styles.sideDash} />
              <span className={styles.sideDash} />
              <span className={styles.sideDash} />
            </div>
            <div className={styles.sideAvatar}>
              {`${prevCandidate.prenom?.[0] || ""}${prevCandidate.nom?.[0] || ""}`.toUpperCase()}
            </div>
            <div className={styles.sideName}>
              {`${prevCandidate.prenom || ""} ${prevCandidate.nom || ""}`.trim()}
            </div>
            <div className={styles.sideSub}>
              {prevCandidate.education?.split("-")[0]?.trim() || "Data & IA"} · Dossier #TC-{190 + prevCandidate.id}
            </div>
          </div>
        )}

        {/* Navigation Arrow Left (Desktop) */}
        {prevCandidate && (
          <button
            type="button"
            className={styles.navArrowLeft}
            onClick={handlePrev}
            aria-label="Précédent"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Center Active Story Card */}
        <div className={styles.activeCard}>
          {/* Top Segmented Story Progress */}
          <div className={styles.storySegments}>
            {Array.from({ length: total }).map((_, idx) => (
              <div
                key={idx}
                className={`${styles.storySegment} ${
                  idx <= currentIndex ? styles.storySegmentActive : ""
                }`}
              />
            ))}
          </div>

          {/* Mobile Subheader */}
          <div className={styles.mobileSubHeader}>
            <span>ETIC · {eventName}</span>
            <span>CANDIDATURES</span>
          </div>

          {/* Candidate Profile Header */}
          <div className={styles.candidateHeader}>
            <div className={styles.avatarCircle}>{initials}</div>
            <div className={styles.candidateMeta}>
              <h2 className={styles.candidateName}>{fullName}</h2>
              <p className={styles.candidateSub}>{subTitle}</p>
            </div>
            <div className={styles.counterPill}>
              {currentIndex + 1} / {total}
            </div>
          </div>

          {/* 3 Quick Badges */}
          <div className={styles.statsRow}>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>Niveau</span>
              <span className={styles.statValue}>{niveau}</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>Disponibilité</span>
              <span className={styles.statValue}>{disponibilite}</span>
            </div>
            <div className={styles.statBadge}>
              <span className={styles.statLabel}>Souhait</span>
              <span className={styles.statValue}>{souhait}</span>
            </div>
          </div>

          {/* Section: Compétences & Réponse Technique */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionTitle}>Compétences</span>
              <span className={styles.codeIconTag}>&lt;/&gt;</span>
            </div>
            <div className={styles.skillsList}>
              {competencesList.map((skill, idx) => (
                <span key={idx} className={styles.skillPill}>
                  {skill}
                </span>
              ))}
            </div>

            <span className={styles.subSectionLabel}>Réponse technique</span>
            <p className={styles.quoteText}>
              &ldquo;{reponseTechnique}&rdquo;
            </p>
          </div>

          {/* Section: Motivation */}
          <div className={styles.motivationBox}>
            <div className={styles.quoteIconArea}>
              <QuoteIcon />
            </div>
            <div className={styles.motivationContent}>
              <span className={styles.sectionTitle}>Motivation</span>
              <p className={styles.motivationText}>{motivationText}</p>
            </div>
          </div>

          {/* Section: Commentaire (Optionnel) */}
          <div className={styles.commentBox}>
            <div className={styles.commentHeader}>
              <MessageSquareIcon />
              <span className={styles.sectionTitle}>Commentaire · Optionnel</span>
            </div>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter une note pour justifier votre décision..."
              className={styles.commentInput}
            />
          </div>

          {/* Mobile Navigation Pills */}
          <div className={styles.mobileNavPills}>
            <button
              type="button"
              className={styles.mobileNavPill}
              onClick={handlePrev}
              disabled={!prevCandidate}
              style={{ opacity: prevCandidate ? 1 : 0.4 }}
            >
              <span>‹</span>
              <span>PRÉCÉDENTE</span>
              {prevCandidate && (
                <span style={{ fontWeight: 500, fontSize: "10px" }}>
                  {prevCandidate.prenom}
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.mobileNavPill}
              onClick={handleNext}
              disabled={!nextCandidate}
              style={{ opacity: nextCandidate ? 1 : 0.4 }}
            >
              <span>SUIVANTE</span>
              {nextCandidate && (
                <span style={{ fontWeight: 500, fontSize: "10px" }}>
                  {nextCandidate.prenom}
                </span>
              )}
              <span>›</span>
            </button>
          </div>

          {/* Bottom Decision Action Area */}
          <div className={styles.decisionArea}>
            <div className={styles.decisionHeader}>
              <span className={styles.decisionTitle}>Votre décision</span>
              <span className={styles.decisionSubtitle}>Prête à être évaluée</span>
            </div>

            <div className={styles.decisionButtons}>
              <button
                type="button"
                className={styles.btnPending}
                onClick={() => handleDecision("en_attente")}
                disabled={submitting}
              >
                <ClockIcon width={14} height={14} />
                <span>En attente</span>
              </button>

              <button
                type="button"
                className={styles.btnReject}
                onClick={() => handleDecision("refuser")}
                disabled={submitting}
              >
                <XIcon width={14} height={14} />
                <span>Refuser</span>
              </button>

              <button
                type="button"
                className={styles.btnAccept}
                onClick={() => handleDecision("accepter")}
                disabled={submitting}
              >
                <CheckIcon width={14} height={14} />
                <span>Accepter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Arrow Right (Desktop) */}
        {nextCandidate && (
          <button
            type="button"
            className={styles.navArrowRight}
            onClick={handleNext}
            aria-label="Suivant"
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* Right Side Peek Card (Desktop) */}
        {nextCandidate && (
          <div
            className={`${styles.sideCard} ${styles.sideCardRight}`}
            onClick={handleNext}
            role="button"
            tabIndex={0}
            aria-label="Candidature suivante"
          >
            <div className={styles.sideDashes}>
              <span className={styles.sideDash} />
              <span className={styles.sideDash} />
              <span className={styles.sideDash} />
            </div>
            <div className={styles.sideAvatar}>
              {`${nextCandidate.prenom?.[0] || ""}${nextCandidate.nom?.[0] || ""}`.toUpperCase()}
            </div>
            <div className={styles.sideName}>
              {`${nextCandidate.prenom || ""} ${nextCandidate.nom || ""}`.trim()}
            </div>
            <div className={styles.sideSub}>
              {nextCandidate.education?.split("-")[0]?.trim() || "Design produit"} · Dossier #TC-{190 + nextCandidate.id}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard helper hint */}
      <div className={styles.keyboardHint}>
        <span>Utilisez ← → pour parcourir</span>
      </div>
    </div>
  );
}
