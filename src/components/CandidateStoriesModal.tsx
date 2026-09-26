"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CandidateDetail } from "@/services/candidateService";
import { RolePreview } from "./TopBar";
import styles from "./stories.module.css";

interface CandidateStoriesModalProps {
  candidate: CandidateDetail;
  onClose: () => void;
  onEvaluate: (
    candidateId: number,
    data: {
      decision: "accepter" | "rejeter" | "en_attente";
      comment: string;
      selectorType: "RH" | "Technique";
      selectorName: string;
    }
  ) => Promise<void>;
  userRole?: RolePreview;
  currentSelectorType?: "RH" | "Technique";
  currentSelectorName?: string;
}

const ALL_STORY_STEPS = [
  { id: "infos", label: "Infos" },
  { id: "cv", label: "CV" },
  { id: "github", label: "GitHub" },
  { id: "competences", label: "Compétences" },
  { id: "projets", label: "Projets" },
  { id: "reponses", label: "Réponses" },
] as const;

export function CandidateStoriesModal({
  candidate,
  onClose,
  onEvaluate,
  userRole = "SUPER_ADMIN",
  currentSelectorType = "RH",
  currentSelectorName = "ETIC Sélecteur",
}: CandidateStoriesModalProps) {
  // Dynamically filter story steps based on role
  const visibleSteps = ALL_STORY_STEPS.filter((step) => {
    if (userRole === "SELECTOR_RH" && step.id === "github") return false;
    if (userRole === "SELECTOR_TECHNIQUE" && step.id === "cv") return false;
    return true;
  });

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [evaluationTrack, setEvaluationTrack] = useState<"RH" | "Technique">(
    currentSelectorType || (userRole === "SELECTOR_TECHNIQUE" ? "Technique" : "RH")
  );

  // Derive clamped active index without triggering cascading re-renders
  const totalSteps = visibleSteps.length;
  const safeActiveStepIndex = Math.min(activeStepIndex, Math.max(0, totalSteps - 1));
  const currentStep = visibleSteps[safeActiveStepIndex] || visibleSteps[0];

  // Evaluation form state for the "Réponses" story
  const [selectedDecision, setSelectedDecision] = useState<"accepter" | "rejeter" | "en_attente">(
    (candidate.finalStatus as "accepter" | "rejeter" | "en_attente") || "en_attente"
  );
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const handleNext = useCallback(() => {
    setActiveStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  const handlePrev = useCallback(() => {
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const initials = `${candidate.prenom?.[0] || ""}${candidate.nom?.[0] || ""}`.toUpperCase();

  const effectiveSelectorType: "RH" | "Technique" =
    userRole === "SUPER_ADMIN"
      ? evaluationTrack
      : userRole === "SELECTOR_TECHNIQUE"
      ? "Technique"
      : currentSelectorType;

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === "STANDARD_USER") return;
    setIsSubmitting(true);
    try {
      await onEvaluate(candidate.id, {
        decision: selectedDecision,
        comment,
        selectorType: effectiveSelectorType,
        selectorName: currentSelectorName,
      });
      setSubmissionFeedback(`Décision enregistrée avec succès à ${new Date().toLocaleTimeString()} !`);
      setTimeout(() => setSubmissionFeedback(null), 3000);
    } catch {
      setSubmissionFeedback("Erreur lors de l'enregistrement de la décision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.storiesOverlay} onClick={onClose}>
      <div className={styles.storiesStage} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Story précédente"
          className={styles.navArrowLeft}
          onClick={handlePrev}
          disabled={safeActiveStepIndex === 0}
        >
          ❮
        </button>

        <div className={styles.storiesContainer}>

        {/* Top Segment Progress Bars */}
        <div className={styles.progressSegments}>
          {visibleSteps.map((step, idx) => {
            const isFilled = idx <= safeActiveStepIndex;
            return (
              <div key={step.id} className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFilled}
                  style={{ width: isFilled ? "100%" : "0%" }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className={styles.storyHeader}>
          <div className={styles.candidateMeta}>
            <div className={styles.candidateAvatar}>{initials}</div>
            <div>
              <h3 className={styles.candidateName}>
                {candidate.prenom} {candidate.nom}
              </h3>
              <span className={styles.stepBadge}>
                {currentStep.label.toUpperCase()} • {safeActiveStepIndex + 1}/{totalSteps}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Tap navigation zones */}
        <div
          className={styles.tapZoneLeft}
          onClick={handlePrev}
          title="Précédent (Touche Flèche Gauche)"
        />
        <div
          className={styles.tapZoneRight}
          onClick={handleNext}
          title="Suivant (Touche Flèche Droite)"
        />

        {/* Story Content Body */}
        <div className={styles.storyBody}>
          {/* STEP: INFOS */}
          {currentStep.id === "infos" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Informations Générales</h4>
                <span className={styles.storyCategoryTag}>Profil</span>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Établissement & Formation</span>
                <span className={styles.cardValue}>{candidate.education}</span>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Contact</span>
                <span className={styles.cardValue}>📧 {candidate.email}</span>
                <span className={styles.cardValue}>📞 {candidate.telephone}</span>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Biographie & Motivation</span>
                <p className={styles.cardValue}>{candidate.bio}</p>
              </div>
            </div>
          )}

          {/* STEP: CV */}
          {currentStep.id === "cv" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Curriculum Vitae</h4>
                <span className={styles.storyCategoryTag}>Document</span>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Aperçu du parcours</span>
                <p className={styles.cardValue}>
                  {candidate.education}
                </p>
                {candidate.cvUrl ? (
                  <a
                    href={candidate.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.submitDecisionBtn}
                    style={{ textAlign: "center", textDecoration: "none", marginTop: "12px" }}
                  >
                    📄 Ouvrir le CV ({candidate.prenom}_{candidate.nom}.pdf)
                  </a>
                ) : (
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>
                    Aucun document CV externe fourni.
                  </p>
                )}
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Coordonnées vérifiées</span>
                <span className={styles.cardValue}>• Email: {candidate.email}</span>
                <span className={styles.cardValue}>• Tél: {candidate.telephone}</span>
              </div>
            </div>
          )}

          {/* STEP: GITHUB */}
          {currentStep.id === "github" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Activité GitHub</h4>
                <span className={styles.storyCategoryTag}>Code</span>
              </div>

              <div className={styles.storyCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className={styles.cardLabel}>Compte GitHub</span>
                    <h5 style={{ fontSize: "16px", fontWeight: "700" }}>
                      {candidate.githubUrl ? candidate.githubUrl.replace("https://github.com/", "@") : "Non renseigné"}
                    </h5>
                  </div>
                  {candidate.githubUrl && (
                    <a
                      href={candidate.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#00DABF", fontSize: "13px", fontWeight: "700", textDecoration: "underline" }}
                    >
                      Voir profil ↗
                    </a>
                  )}
                </div>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Répertoire & Projets associés</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px" }}>
                    <span style={{ fontWeight: "700", color: "#FFFFFF" }}>
                      ⭐ Projets enregistrés: {candidate.projets.length}
                    </span>
                    {candidate.competences.length > 0 && (
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
                        Technologies principales: {candidate.competences.slice(0, 4).join(", ")}.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP: COMPÉTENCES */}
          {currentStep.id === "competences" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Compétences Techniques</h4>
                <span className={styles.storyCategoryTag}>Skills</span>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Technologies déclarées ({candidate.competences.length})</span>
                <div className={styles.skillsGrid}>
                  {candidate.competences.map((skill) => (
                    <span key={skill} className={styles.skillBadge}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.storyCard}>
                <span className={styles.cardLabel}>Évaluation du profil</span>
                <p className={styles.cardValue}>
                  {candidate.competences.length > 0
                    ? `${candidate.competences.length} compétences techniques validées dans le dossier de candidature.`
                    : "Aucune compétence spécifique déclarée."}
                </p>
              </div>
            </div>
          )}

          {/* STEP: PROJETS */}
          {currentStep.id === "projets" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Projets Réalisés</h4>
                <span className={styles.storyCategoryTag}>Portfolio</span>
              </div>

              {candidate.projets.length > 0 ? (
                candidate.projets.map((proj) => (
                  <div key={proj.title} className={styles.projectItem}>
                    <h5 className={styles.projectTitle}>{proj.title}</h5>
                    <p className={styles.projectDesc}>{proj.description}</p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      {proj.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            background: "rgba(255,255,255,0.1)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.storyCard}>
                  <p className={styles.cardValue}>Aucun projet individuel renseigné.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: RÉPONSES (Évaluation & Décision) */}
          {currentStep.id === "reponses" && (
            <div className={styles.storyStepWindow}>
              <div className={styles.storyTitleRow}>
                <h4 className={styles.storyTitle}>Réponses & Évaluation</h4>
                <span className={styles.storyCategoryTag}>Décision</span>
              </div>

              {/* Historique des traitements passés */}
              {candidate.evaluations.length > 0 ? (
                <div className={styles.storyCard}>
                  <span className={styles.cardLabel}>Historique des traitements ({candidate.evaluations.length})</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                    {candidate.evaluations.map((ev) => (
                      <div key={ev.id} className={styles.evalHistoryItem}>
                        <div className={styles.evalMetaHeader}>
                          <span>
                            {ev.selectorName} ({ev.selectorType})
                          </span>
                          <span
                            style={{
                              textTransform: "capitalize",
                              color:
                                ev.decision === "accepter"
                                  ? "#1AAF5D"
                                  : ev.decision === "rejeter"
                                  ? "#C1333F"
                                  : "#EC9E00",
                            }}
                          >
                            {ev.decision}
                          </span>
                        </div>
                        {ev.comment && (
                          <p style={{ fontStyle: "italic", color: "rgba(255,255,255,0.8)" }}>
                            &ldquo;{ev.comment}&rdquo;
                          </p>
                        )}
                        <span className={styles.evalTimestamp}>
                          Traité le : {formatDate(ev.evaluatedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.storyCard}>
                  <span className={styles.cardLabel}>Historique des traitements</span>
                  <p className={styles.cardValue} style={{ color: "rgba(255,255,255,0.6)" }}>
                    Aucune évaluation n&apos;a encore été enregistrée pour ce candidat.
                  </p>
                </div>
              )}

              {/* Read-Only Notice for Standard Users */}
              {userRole === "STANDARD_USER" ? (
                <div className={styles.readOnlyNoticeCard}>
                  <div className={styles.readOnlyBadge}>
                    <span>🔒 Mode Consultation</span>
                  </div>
                  <p className={styles.readOnlyDesc}>
                    Vous êtes en mode lecture seule. Les membres standards peuvent consulter le dossier et l&apos;historique sans pouvoir modifier ou soumettre d&apos;évaluations.
                  </p>
                </div>
              ) : (
                /* Formulaire d'évaluation active pour Sélecteurs & Admins */
                <form onSubmit={handleDecisionSubmit} className={styles.storyCard}>
                  {userRole === "SUPER_ADMIN" ? (
                    <div className={styles.adminTrackToggle}>
                      <span className={styles.cardLabel}>Volet d&apos;évaluation :</span>
                      <div className={styles.trackToggleGroup}>
                        <button
                          type="button"
                          onClick={() => setEvaluationTrack("RH")}
                          className={`${styles.trackBtn} ${evaluationTrack === "RH" ? styles.trackBtnActive : ""}`}
                        >
                          RH
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvaluationTrack("Technique")}
                          className={`${styles.trackBtn} ${evaluationTrack === "Technique" ? styles.trackBtnActive : ""}`}
                        >
                          Technique
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={styles.cardLabel}>
                      Votre décision ({effectiveSelectorType})
                    </span>
                  )}

                  <div className={styles.decisionButtonGroup}>
                    <button
                      type="button"
                      onClick={() => setSelectedDecision("accepter")}
                      className={`${styles.decisionBtn} ${styles.decisionBtnAccepter} ${
                        selectedDecision === "accepter" ? styles.decisionBtnAccepterActive : ""
                      }`}
                    >
                      <span>✓ Accepter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDecision("en_attente")}
                      className={`${styles.decisionBtn} ${styles.decisionBtnAttente} ${
                        selectedDecision === "en_attente" ? styles.decisionBtnAttenteActive : ""
                      }`}
                    >
                      <span>⏳ En attente</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDecision("rejeter")}
                      className={`${styles.decisionBtn} ${styles.decisionBtnRejeter} ${
                        selectedDecision === "rejeter" ? styles.decisionBtnRejeterActive : ""
                      }`}
                    >
                      <span>✕ Rejeter</span>
                    </button>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <span className={styles.cardLabel}>Remarque / Commentaire</span>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Saisissez vos observations sur ce candidat..."
                      className={styles.commentTextarea}
                    />
                  </div>

                  {submissionFeedback && (
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: submissionFeedback.includes("succès") ? "#1AAF5D" : "#C1333F",
                      }}
                    >
                      {submissionFeedback}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitDecisionBtn}
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer la décision"}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      <button
        type="button"
        aria-label="Story suivante"
        className={styles.navArrowRight}
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={safeActiveStepIndex >= totalSteps - 1}
      >
        ❯
      </button>
      </div>
    </div>
  );
}
