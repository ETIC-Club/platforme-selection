export const fullName = (c) => `${c.lastName} ${c.firstName}`;

/** Résumé d'une candidature pour les listes (Admin). */
export const candidateSummary = (c) => ({
  id: c.id,
  reference: c.reference,
  firstName: c.firstName,
  lastName: c.lastName,
  fullName: fullName(c),
  track: c.track,
  status: c.status, // statut FINAL décidé par l'Admin : PENDING | ACCEPTED | REJECTED
  submittedAt: c.submittedAt,
  assignedCount: c.assignedCount,
  isAssigned: c.assignedCount > 0,
  evaluations: {
    completed: c.completed,
    required: c.required,
    fullyEvaluated: c.fullyEvaluated ?? c.completed >= c.required,
  },
});

/** Résumé d'une candidature affectée à un sélecteur. */
export const evaluationStatus = (decision) =>
  !decision ? 'NOT_STARTED' : decision === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED';
