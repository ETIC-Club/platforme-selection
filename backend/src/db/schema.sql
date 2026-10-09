-- Schéma PostgreSQL de la plateforme de sélection ETIC.
-- Exécuter via : npm run db:init   (idempotent : CREATE ... IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('ADMIN', 'SELECTOR')),
  selector_type TEXT CHECK (selector_type IN ('RH', 'TECHNIQUE')),
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- un SELECTOR a toujours un type, un ADMIN n'en a jamais
  CONSTRAINT users_selector_type_chk CHECK ((role = 'SELECTOR') = (selector_type IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS events (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')), -- CLOSED = évaluations verrouillées
  quota               INTEGER NOT NULL DEFAULT 0 CHECK (quota >= 0),                    -- places disponibles au total
  required_rh         INTEGER NOT NULL DEFAULT 1 CHECK (required_rh >= 0),              -- évaluations RH requises / candidature
  required_technical  INTEGER NOT NULL DEFAULT 1 CHECK (required_technical >= 0),       -- évaluations Technique requises / candidature
  closes_on           DATE,                                                             -- clôture des dossiers
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_steps (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  starts_on   DATE NOT NULL,
  ends_on     DATE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Sélecteurs participant à un événement (activation par événement)
CREATE TABLE IF NOT EXISTS event_selectors (
  event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id               SERIAL PRIMARY KEY,
  event_id         INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reference        TEXT NOT NULL,                       -- ex. TC-184
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  track            TEXT NOT NULL,                       -- filière
  school           TEXT,
  study_level      TEXT,
  motivation       TEXT,
  experience       TEXT,
  skills           TEXT[] NOT NULL DEFAULT '{}',
  github_url       TEXT,
  portfolio_url    TEXT,
  technical_answer TEXT,
  status           TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')), -- statut FINAL, décidé par l'Admin
  decided_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_at       TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, event_id),
  UNIQUE (event_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_candidates_event_status ON candidates(event_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_event_track  ON candidates(event_id, track);

CREATE TABLE IF NOT EXISTS assignments (
  id           SERIAL PRIMARY KEY,
  event_id     INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  selector_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, selector_id),
  -- garantit que l'événement de l'affectation est celui de la candidature
  FOREIGN KEY (candidate_id, event_id) REFERENCES candidates(id, event_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assignments_selector ON assignments(selector_id, event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event    ON assignments(event_id);

-- Une évaluation n'existe que pour une candidature affectée à ce sélecteur.
CREATE TABLE IF NOT EXISTS evaluations (
  id           SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL,
  selector_id  INTEGER NOT NULL,
  decision     TEXT NOT NULL CHECK (decision IN ('ACCEPTED', 'REJECTED', 'PENDING')),
  comment      TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, selector_id),
  FOREIGN KEY (candidate_id, selector_id) REFERENCES assignments(candidate_id, selector_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_evaluations_selector ON evaluations(selector_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    INTEGER REFERENCES events(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_id    INTEGER REFERENCES events(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT,
  entity_id   INTEGER,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progression de chaque candidature.
-- Seules les évaluations ACCEPTED / REJECTED comptent comme "réalisées" (PENDING = à traiter).
-- Le compte est plafonné au nombre requis par l'événement (progression jamais > 100 %).
CREATE OR REPLACE VIEW candidate_progress AS
SELECT
  c.id        AS candidate_id,
  c.event_id  AS event_id,
  ev.required_rh        AS rh_required,
  ev.required_technical AS technical_required,
  LEAST(COALESCE(x.rh_done, 0),        ev.required_rh)        AS rh_done,
  LEAST(COALESCE(x.technical_done, 0), ev.required_technical) AS technical_done,
  (COALESCE(x.rh_done, 0) >= ev.required_rh
   AND COALESCE(x.technical_done, 0) >= ev.required_technical) AS fully_evaluated
FROM candidates c
JOIN events ev ON ev.id = c.event_id
LEFT JOIN (
  SELECT e.candidate_id,
         COUNT(*) FILTER (WHERE u.selector_type = 'RH')        AS rh_done,
         COUNT(*) FILTER (WHERE u.selector_type = 'TECHNIQUE') AS technical_done
  FROM evaluations e
  JOIN users u ON u.id = e.selector_id
  WHERE e.decision IN ('ACCEPTED', 'REJECTED')
  GROUP BY e.candidate_id
) x ON x.candidate_id = c.id;
