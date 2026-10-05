# ETIC Platform Selection — Frontend

Application **React + Vite + React Router + Tailwind CSS** (appels API via `fetch`, aucune autre librairie).
Elle communique avec le projet `backend/` via l'API REST décrite dans `backend/docs/API.md`.

## Prérequis
- Node.js ≥ 18
- Le backend lancé sur `http://localhost:5000` (voir `backend/README.md`)

## Installation et lancement
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```
Autres commandes : `npm run build` (production, dossier `dist/`), `npm run preview`.

## Variable d'environnement
| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `VITE_API_URL` | URL de l'API (finit par `/api`) | `http://localhost:5000/api` |

Après modification du `.env`, relancer `npm run dev`.

## Connexion (mode développement)
La page `/login` liste les comptes simulés renvoyés par le backend (`AUTH_MODE=dev`) :
- **Admin** : ETIC Benetic
- **Sélecteurs RH** : Amina Haddad, Yacine Merabet
- **Sélecteurs Technique** : Sofiane Kaci, Lina Boudiaf, Karim Belkacem, Nadia Zerrouki

Le bouton Google est désactivé tant que l'authentification Google n'est pas branchée côté backend.

## Pages
| Route | Rôle | Description |
|---|---|---|
| `/login` | public | connexion |
| `/events` | tous | liste des événements (redirige vers le dashboard s'il n'y en a qu'un) |
| `/events/:eventId/dashboard` | Admin / Sélecteur | dashboard adapté au rôle |
| `/events/:eventId/candidates` | Admin | liste : recherche, filtres, tri, pagination (état dans l'URL) |
| `/events/:eventId/candidates/:candidateId` | Admin | détail, affectation, décision finale |
| `/events/:eventId/selectors` | Admin | suivi, activation/désactivation, affectation automatique |
| `/events/:eventId/selectors/:selectorId` | Admin | détail d'un sélecteur |
| `/events/:eventId/my-candidates` | Sélecteur | mes candidatures (recherche, filtres, tri) |
| `/events/:eventId/my-candidates/:candidateId` | Sélecteur | évaluation : décision, commentaire, navigation, enregistrement |
| `/profile` | tous | profil |

Les routes sont protégées par rôle côté React **et** revérifiées par le backend (403 / 404).

## Structure
```
src/
  components/   layout (Sidebar, Header, recherche, notifications, profil) · ui (cartes, badges, tableaux…)
  pages/        une page par route
  routes/       AppRoutes, ProtectedRoute / RequireRole, EventLayout (charge l'événement)
  services/     api.js (fetch centralisé, token, erreurs) · endpoints.js (un appel par endpoint)
  hooks/        useApi (loading / erreur / reload) · useDebounce
  context/      AuthContext (session, login, logout)
  utils/        formatage des dates, libellés
```
