# Contrat d'API — ETIC Platform Selection

Base URL : `http://localhost:5000/api` · Format : JSON · Auth : `Authorization: Bearer <token>`

**Ce document est la référence unique** : le frontend utilise exactement ces noms de champs.

## Conventions

| Sujet | Règle |
|---|---|
| Rôles | `ADMIN`, `SELECTOR` |
| Type de sélecteur | `RH`, `TECHNIQUE` (`null` pour un ADMIN) |
| Décision d'évaluation | `ACCEPTED`, `REJECTED`, `PENDING` |
| Statut final d'une candidature | `PENDING`, `ACCEPTED`, `REJECTED` — **décidé manuellement par l'Admin** |
| Dates | ISO 8601 (`2026-10-04T10:00:00.000Z`), ou `YYYY-MM-DD` pour `closesOn`, `startsOn`, `endsOn` |
| Évaluation « réalisée » | `ACCEPTED` ou `REJECTED` uniquement. `PENDING` = encore à traiter |
| Candidature « complètement évaluée » | nombre d'évaluations réalisées RH **et** Technique ≥ requis par l'événement |
| Pagination | `?page=1&pageSize=20` (max 100) → `pagination: { page, pageSize, total, totalPages }` |

### Erreurs

Toujours : `{ "error": { "code": "…", "message": "…", "details": {…}? } }`

| HTTP | `code` | Cas |
|---|---|---|
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN` | pas de token / token expiré |
| 403 | `FORBIDDEN`, `EVENT_ACCESS_DENIED`, `ACCOUNT_DISABLED`, `USER_NOT_ALLOWED` | rôle insuffisant, événement non autorisé, compte désactivé |
| 404 | `EVENT_NOT_FOUND`, `CANDIDATE_NOT_FOUND`, `SELECTOR_NOT_FOUND`, `ASSIGNMENT_NOT_FOUND`, `NOTIFICATION_NOT_FOUND`, `ROUTE_NOT_FOUND` | ressource absente — **ou non affectée au sélecteur** |
| 409 | `EVENT_CLOSED`, `QUOTA_REACHED`, `ALREADY_ASSIGNED`, `HAS_EVALUATION`, `CONFLICT` | conflit métier |
| 422 | `VALIDATION_ERROR` | paramètre ou corps invalide (`details` par champ) |
| 501 | `NOT_IMPLEMENTED` | authentification Google pas encore branchée |
| 500 | `INTERNAL_ERROR` | erreur serveur |

### Permissions

| Zone | ADMIN | SELECTOR |
|---|---|---|
| `/profile`, `/notifications`, `/events`, `/events/:id`, `/events/:id/search` | ✅ | ✅ (seulement ses événements) |
| `dashboard`, `candidates*`, `selectors*`, `assignments/auto` | ✅ | ❌ 403 |
| `my-dashboard`, `my-candidates*`, `…/evaluation` | ❌ 403 | ✅ |

Le sélecteur est **toujours** celui du token. Une candidature non affectée à un sélecteur renvoie `404 CANDIDATE_NOT_FOUND` (on ne révèle pas son existence).

---

## Authentification

### `GET /auth/dev-users` · `POST /auth/dev-login` — uniquement si `AUTH_MODE=dev`
```json
// POST body : { "userId": 2 }   ou   { "email": "amina.haddad@esi.dz" }
{
  "token": "eyJhbGciOi…",
  "user": { "id": 2, "name": "Amina Haddad", "email": "amina.haddad@esi.dz",
            "role": "SELECTOR", "selectorType": "RH", "avatarUrl": null, "isActive": true }
}
```
`GET /auth/dev-users` → `{ "items": [User, …] }`

### `POST /auth/google` — `{ "idToken": "…" }` → même réponse que dev-login (501 tant que non branché).

## Profil

### `GET /profile` → `{ "user": User }`

## Notifications

### `GET /notifications?unread=true&limit=20`
```json
{ "unreadCount": 2,
  "items": [ { "id": 5, "type": "ASSIGNMENT", "title": "Nouvelle candidature affectée",
               "message": "Toudert Emilia (TC-101) vous a été affectée.",
               "link": "/events/1/my-candidates/1", "isRead": false,
               "createdAt": "2026-10-04T10:00:00.000Z", "eventId": 1 } ] }
```
### `PATCH /notifications/:id/read` → `{ "id": 5, "isRead": true }`
### `POST /notifications/read-all` → `{ "unreadCount": 0 }`

## Événements

### `GET /events` → `{ "items": [Event, …] }` (Admin : tous · Sélecteur : les siens)
### `GET /events/:eventId` → `{ "event": Event, "nextSteps": [NextStep, …] }`

```json
// Event
{ "id": 1, "name": "Training Camp XIII", "description": "…", "status": "OPEN",
  "quota": 42, "closesOn": "2026-10-09",
  "requiredEvaluations": { "rh": 1, "technical": 1 } }

// NextStep  (state : DONE | ONGOING | SOON | UPCOMING ; daysLeft renseigné seulement si SOON)
{ "id": 1, "title": "Clôture des dossiers", "startsOn": "2026-10-09", "endsOn": null,
  "state": "SOON", "daysLeft": 5 }
```

### `GET /events/:eventId/search?q=emi`
Admin → candidats + sélecteurs · Sélecteur → uniquement SES candidatures. `q` ≥ 2 caractères.
```json
{ "query": "emi",
  "candidates": [ { "id": 1, "reference": "TC-101", "fullName": "Toudert Emilia", "track": "UI UX", "status": "ACCEPTED" } ],
  "selectors":  [ { "id": 2, "name": "Amina Haddad", "email": "amina.haddad@esi.dz", "type": "RH" } ] }
```
(`status` absent pour un sélecteur.)

---

## ADMIN

### `GET /events/:eventId/dashboard`
```json
{
  "event": { "id": 1, "name": "Training Camp XIII", "…": "…" },
  "candidates": { "total": 120, "assigned": 120, "fullyEvaluated": 84, "remaining": 36 },
  "results": { "accepted": 30, "rejected": 54, "pending": 36 },
  "evaluations": {
    "rh":        { "completed": 90,  "required": 120 },
    "technical": { "completed": 88,  "required": 120 },
    "completed": 178, "required": 240, "remaining": 62, "progress": 74
  },
  "quota": { "total": 42, "accepted": 30, "remaining": 12 },
  "tracks": [ { "name": "UI UX", "candidates": 30, "completed": 45, "required": 60, "remaining": 15, "progress": 75 } ],
  "selectorsBreakdown": { "rh": { "count": 2, "percent": 33 }, "technical": { "count": 4, "percent": 67 } },
  "selectors": [ SelectorProgress, … ],
  "recentCandidates":  [ CandidateSummary, … ],
  "pendingCandidates": [ CandidateSummary, … ],
  "nextSteps": [ NextStep, … ]
}
```
```json
// SelectorProgress
{ "id": 2, "name": "Amina Haddad", "email": "…", "avatarUrl": null, "type": "RH", "isActive": true,
  "assigned": 60, "evaluated": 48, "remaining": 12, "progress": 80,
  "decisions": { "accepted": 20, "rejected": 28, "pending": 3 } }

// CandidateSummary
{ "id": 1, "reference": "TC-101", "firstName": "Emilia", "lastName": "Toudert", "fullName": "Toudert Emilia",
  "track": "UI UX", "status": "ACCEPTED", "submittedAt": "…", "assignedCount": 2, "isAssigned": true,
  "evaluations": { "completed": 2, "required": 2, "fullyEvaluated": true } }
```

### `GET /events/:eventId/candidates`
Query : `search`, `track`, `status`, `evaluation` (`COMPLETE|INCOMPLETE`), `assigned` (`true|false`),
`sort` (`submittedAt|name|track|status|progress`), `order` (`asc|desc`), `page`, `pageSize`.
```json
{ "items": [ CandidateSummary, … ], "pagination": { "page": 1, "pageSize": 20, "total": 120, "totalPages": 6 },
  "filters": { "tracks": ["Agentic AI", "Backend", "Frontend", "UI UX"] } }
```

### `GET /events/:eventId/candidates/:candidateId`
```json
{
  "candidate": { "id": 1, "reference": "TC-101", "firstName": "Emilia", "lastName": "Toudert", "fullName": "Toudert Emilia",
    "email": "…", "phone": "…", "track": "UI UX", "school": "ESI Alger", "studyLevel": "2CS",
    "motivation": "…", "experience": "…", "skills": ["Figma"], "githubUrl": "…", "portfolioUrl": null,
    "technicalAnswer": "…", "submittedAt": "…", "status": "ACCEPTED", "decidedAt": "…", "decidedByName": "ETIC Benetic" },
  "progress": { "rh": { "completed": 1, "required": 1 }, "technical": { "completed": 1, "required": 1 },
                "completed": 2, "required": 2, "fullyEvaluated": true },
  "assignments": [ { "selectorId": 2, "name": "Amina Haddad", "email": "…", "type": "RH", "assignedAt": "…",
                     "evaluation": { "decision": "ACCEPTED", "comment": "…", "evaluatedAt": "…" } } ]
}
```
(`evaluation` vaut `null` si le sélecteur n'a rien enregistré.)

### `PATCH /events/:eventId/candidates/:candidateId/status` — décision finale manuelle
Body `{ "status": "ACCEPTED" }` → `{ "id": 1, "status": "ACCEPTED", "decidedAt": "…", "decidedByName": "…" }`
Erreurs : `409 QUOTA_REACHED` si le quota de places est atteint, `422` si identique au statut actuel.

### `POST /events/:eventId/candidates/:candidateId/assignments`
Body `{ "selectorId": 3 }` → `201 { "candidateId": 1, "selectorId": 3 }` (notifie le sélecteur). Erreurs : `409 ALREADY_ASSIGNED`, `404 SELECTOR_NOT_FOUND`.

### `DELETE /events/:eventId/candidates/:candidateId/assignments/:selectorId` → `204`
Erreur : `409 HAS_EVALUATION` si le sélecteur a déjà enregistré une évaluation.

### `POST /events/:eventId/assignments/auto` — affectation automatique (sélecteur le moins chargé)
→ `{ "created": 12, "missing": 0, "selectorsNotified": 3 }` (`missing` = places d'évaluateur impossibles à pourvoir faute de sélecteurs).

### `GET /events/:eventId/selectors`
```json
{ "items": [ SelectorProgress, … ], "summary": { "total": 6, "rh": 2, "technical": 4, "active": 6 } }
```

### `GET /events/:eventId/selectors/:selectorId`
```json
{ "selector": SelectorProgress,
  "candidates": [ { "candidateId": 1, "reference": "TC-101", "fullName": "Toudert Emilia", "track": "UI UX",
                    "decision": "ACCEPTED", "evaluationStatus": "COMPLETED", "evaluatedAt": "…" } ] }
```
`evaluationStatus` : `NOT_STARTED` (aucune évaluation) · `IN_PROGRESS` (décision `PENDING`) · `COMPLETED`.

### `PATCH /events/:eventId/selectors/:selectorId` — activation / désactivation
Body `{ "isActive": false }` → `{ "id": 3, "isActive": false }` (un sélecteur désactivé reçoit `403 EVENT_ACCESS_DENIED` sur cet événement).

---

## SELECTOR

### `GET /events/:eventId/my-dashboard`
```json
{
  "event": Event,
  "assigned": 60, "evaluated": 48, "remaining": 12, "progress": 80,
  "decisions": { "accepted": 20, "rejected": 28, "pending": 3 },
  "nextCandidateId": 96,
  "latestEvaluated": [ { "candidateId": 80, "reference": "TC-181", "fullName": "…", "track": "Backend",
                         "decision": "ACCEPTED", "evaluatedAt": "…" } ],
  "nextSteps": [ NextStep, … ]
}
```
`evaluated` = `accepted + rejected`. Les `pending` restent comptés dans `remaining`. `nextCandidateId` alimente « Reprendre l'évaluation » (`null` si tout est évalué).

### `GET /events/:eventId/my-candidates`
Query : `search`, `track`, `decision` (`ACCEPTED|REJECTED|PENDING|NOT_STARTED|TODO`), `sort` (`submittedAt|name|track|evaluatedAt`), `order`, `page`, `pageSize`.
```json
{ "items": [ { "candidateId": 1, "reference": "TC-101", "firstName": "Emilia", "lastName": "Toudert",
               "fullName": "Toudert Emilia", "track": "UI UX", "decision": null,
               "evaluationStatus": "NOT_STARTED", "evaluatedAt": null, "submittedAt": "…", "assignedAt": "…" } ],
  "pagination": { … }, "filters": { "tracks": [ … ] } }
```

### `GET /events/:eventId/my-candidates/:candidateId`
Champs visibles selon le type : **RH** → `school, studyLevel, motivation, experience` · **TECHNIQUE** → `school, studyLevel, skills, githubUrl, portfolioUrl, technicalAnswer`. Jamais d'email, téléphone ni statut final.
```json
{
  "candidate": { "id": 1, "reference": "TC-101", "firstName": "Emilia", "lastName": "Toudert", "fullName": "Toudert Emilia",
                 "track": "UI UX", "submittedAt": "…", "school": "…", "studyLevel": "…", "motivation": "…", "experience": "…" },
  "visibleFields": ["school", "studyLevel", "motivation", "experience"],
  "myEvaluation": { "decision": "PENDING", "comment": "…", "evaluatedAt": "…" },
  "navigation": { "position": 3, "total": 60, "previousId": 2, "nextId": 4, "nextToEvaluateId": 4 }
}
```
(`myEvaluation` vaut `null` si rien n'est enregistré.)

### `POST /events/:eventId/candidates/:candidateId/evaluation`
Body `{ "decision": "ACCEPTED", "comment": "Très bon dossier." }` (`comment` optionnel, 2000 car. max). Crée ou met à jour l'évaluation.
```json
{
  "evaluation": { "candidateId": 1, "decision": "ACCEPTED", "comment": "Très bon dossier.", "evaluatedAt": "…" },
  "stats": { "assigned": 60, "evaluated": 49, "remaining": 11, "progress": 82,
             "decisions": { "accepted": 21, "rejected": 28, "pending": 3 } },
  "navigation": { "position": 1, "total": 60, "previousId": null, "nextId": 2, "nextToEvaluateId": 2 }
}
```
Erreurs : `404 CANDIDATE_NOT_FOUND` (non affectée), `409 EVENT_CLOSED`, `422 VALIDATION_ERROR`.
