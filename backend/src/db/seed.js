/**
 * Données de développement (déterministes) :
 *  1 événement "Training Camp XIII" · 120 candidats · 4 filières · 6 sélecteurs (2 RH + 4 Techniques)
 *  Chaque candidat est affecté à 1 sélecteur RH (alternance) et à 1 sélecteur Technique (spécialisé par filière).
 *  84 candidatures sont complètement évaluées (30 acceptées, 54 rejetées — statut final fixé "par l'Admin"),
 *  36 sont en attente avec des évaluations partielles ou en cours (PENDING).
 * Usage : npm run db:seed   (base vide)   ou   npm run db:reset   (recrée tout)
 */
import { pool, withTransaction } from '../config/db.js';

const TRACKS = ['UI UX', 'Agentic AI', 'Backend', 'Frontend'];
const FIRST = ['Emilia', 'Yanis', 'Lina', 'Rayan', 'Ines', 'Anis', 'Sara', 'Walid', 'Meriem', 'Adam', 'Nour', 'Amir',
  'Sabrina', 'Ilyes', 'Dounia', 'Zakaria', 'Hiba', 'Mehdi', 'Chaima', 'Riad', 'Selma', 'Fares', 'Maya', 'Bilal'];
const LAST = ['Toudert', 'Benali', 'Kaci', 'Mansouri', 'Haddad', 'Belkacem', 'Cherif', 'Boudiaf', 'Zerrouki', 'Merabet',
  'Ouali', 'Hamdi', 'Slimani', 'Bouzid', 'Khelifi', 'Amrani', 'Taleb', 'Messaoudi', 'Rahmani', 'Saidi',
  'Djebbar', 'Lounis', 'Ferhat', 'Bensalem', 'Yahiaoui', 'Guerfi', 'Hadjadj', 'Maamar', 'Sebti', 'Tebib'];
const SCHOOLS = ['ESI Alger', 'ENSIA', 'USTHB', 'ESI-SBA', 'Université de Bejaia', 'ENSTA'];
const LEVELS = ['2CP', '1CS', '2CS', '3CS', 'Licence 3', 'Master 1'];

const BY_TRACK = {
  'UI UX': {
    skills: ['Figma', 'Design system', 'Recherche utilisateur', 'Prototypage'],
    motivation: "Je veux apprendre à concevoir des interfaces accessibles et cohérentes au sein d'une équipe produit.",
    answer: "Je commencerais par des interviews utilisateurs puis un prototype basse fidélité testé avant toute mise en forme.",
  },
  'Agentic AI': {
    skills: ['Python', 'LLM', 'LangChain', 'RAG'],
    motivation: "Les agents autonomes me passionnent : je veux construire des systèmes qui planifient et utilisent des outils.",
    answer: "Je découpe la tâche en outils simples, j'ajoute une mémoire courte et j'évalue les réponses avec un jeu de tests.",
  },
  Backend: {
    skills: ['Node.js', 'PostgreSQL', 'REST', 'Docker'],
    motivation: "Je veux maîtriser la conception d'API robustes et apprendre les bonnes pratiques de production.",
    answer: "Je modélise d'abord les tables et les contraintes, puis j'expose des endpoints validés avec des tests d'intégration.",
  },
  Frontend: {
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibilité'],
    motivation: "J'aime transformer des maquettes en interfaces rapides, réactives et agréables à utiliser.",
    answer: "Je découpe l'écran en composants réutilisables et je gère l'état serveur séparément de l'état local.",
  },
};

const COMMENTS = {
  ACCEPTED: ['Profil solide et motivation claire.', 'Très bonne communication, à retenir.', 'Projets concrets, bon potentiel.'],
  REJECTED: ['Motivation trop générique.', 'Niveau technique insuffisant pour la filière.', 'Dossier incomplet, peu de projets.'],
  PENDING: ['À revoir, j\'hésite entre deux avis.', 'Besoin d\'un second regard sur le projet.'],
};
const pick = (list, i) => list[i % list.length];
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

async function main() {
  const existing = (await pool.query('SELECT COUNT(*) AS n FROM users')).rows[0].n;
  if (existing > 0) {
    console.error('La base contient déjà des données. Utilisez "npm run db:reset" pour tout recréer.');
    process.exitCode = 1;
    return;
  }

  await withTransaction(async (db) => {
    /* ---- Utilisateurs ---- */
    const insertUser = async (name, email, role, type) =>
      (await db.query(
        `INSERT INTO users (name, email, role, selector_type) VALUES ($1, $2, $3, $4) RETURNING id`,
        [name, email, role, type],
      )).rows[0].id;

    const adminId = await insertUser('ETIC Benetic', 'etic@esi.dz', 'ADMIN', null);
    const rh = [
      await insertUser('Amina Haddad', 'amina.haddad@esi.dz', 'SELECTOR', 'RH'),
      await insertUser('Yacine Merabet', 'yacine.merabet@esi.dz', 'SELECTOR', 'RH'),
    ];
    const tech = [ // un sélecteur Technique par filière, dans l'ordre de TRACKS
      await insertUser('Sofiane Kaci', 'sofiane.kaci@esi.dz', 'SELECTOR', 'TECHNIQUE'),
      await insertUser('Lina Boudiaf', 'lina.boudiaf@esi.dz', 'SELECTOR', 'TECHNIQUE'),
      await insertUser('Karim Belkacem', 'karim.belkacem@esi.dz', 'SELECTOR', 'TECHNIQUE'),
      await insertUser('Nadia Zerrouki', 'nadia.zerrouki@esi.dz', 'SELECTOR', 'TECHNIQUE'),
    ];

    /* ---- Événement ---- */
    const eventId = (await db.query(
      `INSERT INTO events (name, description, status, quota, required_rh, required_technical, closes_on)
       VALUES ('Training Camp XIII', 'Sélection des participants au Training Camp XIII du club ETIC.', 'OPEN', 42, 1, 1,
               CURRENT_DATE + 5) RETURNING id`,
    )).rows[0].id;

    await db.query(
      `INSERT INTO event_steps (event_id, title, starts_on, ends_on, sort_order) VALUES
        ($1, 'Clôture des dossiers',      CURRENT_DATE + 5,  NULL,               1),
        ($1, 'Export vers Google Sheets', CURRENT_DATE + 9,  CURRENT_DATE + 12,  2),
        ($1, 'Résultats finaux',          CURRENT_DATE + 25, NULL,               3)`,
      [eventId],
    );
    for (const id of [...rh, ...tech]) {
      await db.query('INSERT INTO event_selectors (event_id, user_id) VALUES ($1, $2)', [eventId, id]);
    }

    /* ---- Candidats, affectations, évaluations ---- */
    const TOTAL = 120;
    const DONE = 84; // candidatures complètement évaluées
    for (let i = 0; i < TOTAL; i += 1) {
      const trackIndex = i % 4;
      const track = TRACKS[trackIndex];
      const t = BY_TRACK[track];
      const firstName = i === 0 ? 'Emilia' : pick(FIRST, i * 5 + 1);
      const lastName = i === 0 ? 'Toudert' : pick(LAST, i * 7 + 3);
      const hoursAgo = (TOTAL - i) * 5;

      let finalStatus = 'PENDING';
      if (i < DONE) finalStatus = i % 14 < 5 ? 'ACCEPTED' : 'REJECTED';

      const candidateId = (await db.query(
        `INSERT INTO candidates (event_id, reference, first_name, last_name, email, phone, track, school, study_level,
                                 motivation, experience, skills, github_url, portfolio_url, technical_answer,
                                 status, decided_by, decided_at, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
                 CASE WHEN $16 = 'PENDING' THEN NULL ELSE now() - ($18 * interval '1 hour') + interval '6 hours' END,
                 now() - ($18 * interval '1 hour'))
         RETURNING id`,
        [
          eventId, `TC-${101 + i}`, firstName, lastName,
          `${slug(firstName)}.${slug(lastName)}${i + 1}@example.com`,
          `05 5${String(10 + (i % 90)).padStart(2, '0')} ${String(100 + i).slice(-2)} ${String(20 + (i * 3) % 80)} 1${i % 10}`,
          track, pick(SCHOOLS, i + trackIndex), pick(LEVELS, i * 3),
          t.motivation,
          i % 3 === 0 ? 'Membre actif de club, deux hackathons.' : i % 3 === 1 ? 'Stage de 2 mois, projets personnels.' : 'Projets de cours et contributions open source.',
          t.skills,
          `https://github.com/${slug(firstName)}${slug(lastName)}${i + 1}`,
          i % 2 === 0 ? `https://${slug(firstName)}-${slug(lastName)}${i + 1}.dev` : null,
          t.answer,
          finalStatus, finalStatus === 'PENDING' ? null : adminId, hoursAgo,
        ],
      )).rows[0].id;

      const rhId = rh[i % 2];
      const techId = tech[trackIndex];
      for (const sid of [rhId, techId]) {
        await db.query('INSERT INTO assignments (event_id, candidate_id, selector_id) VALUES ($1,$2,$3)', [eventId, candidateId, sid]);
      }

      // Décisions des évaluateurs
      let rhDecision = null;
      let techDecision = null;
      if (i < DONE) {
        if (finalStatus === 'ACCEPTED') { rhDecision = 'ACCEPTED'; techDecision = i % 14 === 0 ? 'REJECTED' : 'ACCEPTED'; }
        else { techDecision = 'REJECTED'; rhDecision = i % 9 === 0 ? 'ACCEPTED' : 'REJECTED'; }
      } else {
        switch ((i - DONE) % 6) {
          case 1: rhDecision = 'ACCEPTED'; break;
          case 2: techDecision = 'REJECTED'; break;
          case 3: rhDecision = 'PENDING'; break;
          case 4: rhDecision = 'ACCEPTED'; techDecision = 'PENDING'; break;
          case 5: rhDecision = 'PENDING'; techDecision = 'PENDING'; break;
          default: break; // 0 : aucune évaluation
        }
      }
      const insertEval = (sid, decision, plusHours) =>
        db.query(
          `INSERT INTO evaluations (candidate_id, selector_id, decision, comment, evaluated_at)
           VALUES ($1, $2, $3, $4, now() - ($5 * interval '1 hour') + ($6 * interval '1 hour'))`,
          [candidateId, sid, decision, pick(COMMENTS[decision], i), hoursAgo, plusHours],
        );
      if (rhDecision) await insertEval(rhId, rhDecision, 2);
      if (techDecision) await insertEval(techId, techDecision, 4);
    }

    /* ---- Notifications ---- */
    const link = `/events/${eventId}`;
    await db.query(
      `INSERT INTO notifications (user_id, event_id, type, title, message, link, is_read, created_at) VALUES
        ($1, $2, 'INFO', 'Clôture des dossiers dans 5 jours', 'Pensez à relancer les sélecteurs en retard.', $3, FALSE, now() - interval '2 hours'),
        ($1, $2, 'CANDIDATE_FULLY_EVALUATED', 'Candidature complètement évaluée', 'Toudert Emilia (TC-101) a reçu toutes ses évaluations.', $4, FALSE, now() - interval '1 day'),
        ($1, $2, 'INFO', 'Événement créé', 'Training Camp XIII est prêt.', $3, TRUE, now() - interval '20 days')`,
      [adminId, eventId, `${link}/dashboard`, `${link}/candidates/1`],
    );
    for (const sid of [...rh, ...tech]) {
      await db.query(
        `INSERT INTO notifications (user_id, event_id, type, title, message, link, is_read, created_at) VALUES
          ($1, $2, 'ASSIGNMENT', 'Candidatures affectées', 'Des candidatures vous ont été affectées pour Training Camp XIII.', $3, FALSE, now() - interval '3 hours'),
          ($1, $2, 'INFO', 'Rappel', 'Les dossiers se clôturent dans 5 jours.', $4, TRUE, now() - interval '2 days')`,
        [sid, eventId, `${link}/my-candidates`, `${link}/my-dashboard`],
      );
    }
    await db.query(
      `INSERT INTO logs (user_id, event_id, action, entity, entity_id, metadata) VALUES ($1, $2, 'SEED', 'event', $2, '{"candidates":120}')`,
      [adminId, eventId],
    );
  });

  console.log('Données de test créées : Training Camp XIII · 120 candidats · 6 sélecteurs (2 RH + 4 Techniques).');
  console.log('Comptes (AUTH_MODE=dev) : etic@esi.dz (ADMIN), amina.haddad@esi.dz (RH), sofiane.kaci@esi.dz (TECHNIQUE)…');
}

try {
  await main();
} catch (err) {
  console.error('Erreur pendant le seed :', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
