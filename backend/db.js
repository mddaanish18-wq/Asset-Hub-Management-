const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'ups_assets_v2.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    region TEXT,
    type TEXT,
    health_score INTEGER,
    risk_level TEXT,
    predicted_failure TEXT,
    sensor_trends JSON,
    confidence TEXT,
    technician_notes TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_ids TEXT,
    user_prompt TEXT,
    asset_context JSON,
    plan_details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS telemetry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT,
    event_type TEXT,
    event_data JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prediction_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT,
    description TEXT,
    horizon_hours INTEGER,
    prediction_result JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT,
    action_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    timeline TEXT,
    scheduled_date DATETIME,
    status TEXT DEFAULT 'pending',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  );
`);

module.exports = db;
