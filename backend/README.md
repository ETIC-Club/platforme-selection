# ETIC Platform Selection — Backend

API REST **Node.js + Express + PostgreSQL** (SQL brut avec `pg`, sans ORM).
Contrat complet des réponses : [`docs/API.md`](docs/API.md).

## Prérequis
- Node.js ≥ 18
- PostgreSQL ≥ 13 (une base vide, ex. `etic_selection`)

## Installation
```bash
cd backend
npm install
cp .env.example .env      # puis adapter DATABASE_URL et JWT_SECRET
createdb etic_selection   # ou via pgAdmin / psql
```

## Variables d'environnement (`.env`)
| Variable | Rôle | Exemple |
|---|---|---|
| `PORT` | port de l'API | `5000` |
| `DATABASE_URL` | connexion PostgreSQL | `postgres://postgres:postgres@localhost:5432/etic_selection` |
| `CORS_ORIGIN` | URL(s) du frontend, séparées par `,` | `http://localhost:5173` |
| `JWT_SECRET` | secret de signature des tokens | longue chaîne aléatoire |
| `JWT_EXPIRES_IN` | durée de session | `8h` |
| `AUTH_MODE` | `dev` (utilisateurs simulés) ou `google` | `dev` |
| `GOOGLE_CLIENT_ID` | pour l'auth Google (à brancher) | |

`AUTH_MODE=dev` est refusé automatiquement si `NODE_ENV=production`.

## Base de données
```bash
npm run db:init    # crée les tables et la vue candidate_progress
npm run db:seed    # données de test (base vide uniquement)
npm run db:reset   # supprime TOUT puis recrée schéma + données (dev uniquement)
```
Données de test : **Training Camp XIII**, 120 candidats, 4 filières (UI UX, Agentic AI, Backend, Frontend), 6 sélecteurs (2 RH, 4 Techniques), 84 candidatures complètement évaluées (30 acceptées, 54 rejetées), 36 en attente, quota de 42 places (12 restantes).

Comptes de test (`AUTH_MODE=dev`) :
| Rôle | Email |
|---|---|
| ADMIN | `etic@esi.dz` |
| SELECTOR RH | `amina.haddad@esi.dz`, `yacine.merabet@esi.dz` |
| SELECTOR TECHNIQUE | `sofiane.kaci@esi.dz` (UI UX), `lina.boudiaf@esi.dz` (Agentic AI), `karim.belkacem@esi.dz` (Backend), `nadia.zerrouki@esi.dz` (Frontend) |

## Lancer
```bash
npm run dev     # rechargement automatique
npm start       # production
```
API : `http://localhost:5000/api` · test rapide : `curl http://localhost:5000/api/health`

### Tester sans frontend
```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/dev-login -H 'Content-Type: application/json' \
  -d '{"email":"etic@esi.dz"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -H "Authorization: Bearer $TOKEN" localhost:5000/api/events/1/dashboard
```

## Architecture
```
src/
  config/       env.js, db.js (pool pg + transactions)
  db/           schema.sql, init.js, seed.js
  middlewares/  authenticate (JWT), requireRole, loadEvent (accès à l'événement), errorHandler
  routes/       déclaration des URLs uniquement
  controllers/  lecture de la requête → appel du service → réponse
  services/     logique métier (stats, permissions de champs, évaluation, affectations)
  models/       requêtes SQL
  utils/        AppError, validateurs, formatage
```

## Règles métier
- **Évaluation réalisée** = `ACCEPTED` ou `REJECTED`. `PENDING` reste « à traiter ».
- **Complètement évaluée** = évaluations RH et Technique réalisées ≥ `required_rh` / `required_technical` de l'événement (configurables dans la table `events`).
- **Statut final** (accepté / rejeté / en attente) : décidé **manuellement** par l'Admin, jamais calculé.
- **Progression globale** = évaluations réalisées ÷ évaluations requises (plafonnée par candidature).
- **Permissions** vérifiées côté serveur : le sélecteur vient du token, jamais de l'URL ; une candidature non affectée → `404`.

## Brancher l'authentification Google
Voir le plan en commentaire dans `src/services/authService.js` (`verifyGoogleIdToken`) puis `AUTH_MODE=google`.
