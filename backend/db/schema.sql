-- backend/db/schema.sql — SQLite schema for HK18 Prophet

CREATE TABLE IF NOT EXISTS simulations (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  rounds INTEGER NOT NULL DEFAULT 3,
  seed_data TEXT,
  prediction_query TEXT,
  report TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS district_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulation_id TEXT NOT NULL,
  district_code TEXT NOT NULL,
  district_name TEXT,
  direction TEXT,
  predicted_change_3m TEXT,
  predicted_change_6m TEXT,
  predicted_change_12m TEXT,
  confidence REAL,
  key_factors TEXT,
  risks TEXT,
  agent_consensus TEXT,
  narrative TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (simulation_id) REFERENCES simulations(id)
);

CREATE TABLE IF NOT EXISTS actual_outcomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  district_code TEXT NOT NULL,
  recorded_date TEXT NOT NULL,
  price_per_sqft REAL,
  ccl_index REAL,
  transaction_volume INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seed_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  source TEXT,
  data_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dp_simulation ON district_predictions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_dp_district ON district_predictions(district_code);
CREATE INDEX IF NOT EXISTS idx_ao_district ON actual_outcomes(district_code);
CREATE INDEX IF NOT EXISTS idx_sd_category ON seed_data(category);
