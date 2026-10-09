export const formatDate = (iso) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

export const formatDateShort = (iso) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `Il y a ${d} j` : formatDateShort(iso);
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export const plural = (n, one, many) => (n > 1 ? many : one);

export const STATUS_LABELS = { ACCEPTED: 'Acceptée', REJECTED: 'Refusée', PENDING: 'En attente' };
export const EVAL_STATUS_LABELS = { NOT_STARTED: 'Non commencée', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée' };
export const TYPE_LABELS = { RH: 'RH', TECHNIQUE: 'Technique' };
export const ROLE_LABELS = { ADMIN: 'Administrateur', SELECTOR: 'Sélecteur' };

export const FIELD_LABELS = {
  school: 'École',
  studyLevel: "Niveau d'études",
  motivation: 'Motivation',
  experience: 'Expérience',
  skills: 'Compétences',
  githubUrl: 'GitHub',
  portfolioUrl: 'Portfolio',
  technicalAnswer: 'Réponse technique',
};
