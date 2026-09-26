CREATE TABLE IF NOT EXISTS tracker_auth (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  passcode_salt TEXT NOT NULL,
  passcode_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS periods (
  start_date TEXT PRIMARY KEY,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flow_logs (
  log_date TEXT PRIMARY KEY,
  flow TEXT NOT NULL CHECK (flow IN ('Spotting', 'Light', 'Medium', 'Heavy', 'No bleeding')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mood_logs (
  log_date TEXT PRIMARY KEY,
  mood TEXT NOT NULL CHECK (mood IN ('Lovely', 'Okay', 'Low', 'Tender', 'Frustrated')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracker_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 18 AND 45),
  period_length INTEGER NOT NULL DEFAULT 5 CHECK (period_length BETWEEN 1 AND 12)
);

CREATE TABLE IF NOT EXISTS auth_attempts (
  ip_fingerprint TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL
);
