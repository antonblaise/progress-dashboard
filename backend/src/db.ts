import Database from "better-sqlite3";

// DB to store the real-time data to be reflected across all clients
const progress_dashboard_db = new Database("db/progress-dashboard.db");

progress_dashboard_db.pragma("journal_mode = WAL");

progress_dashboard_db.exec(`
    CREATE TABLE IF NOT EXISTS dataStorage (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    );
`);

// DB to store historical changes
const history_db = new Database("db/history.db");

history_db.pragma("journal_mode = WAL");

history_db.exec(`
    CREATE TABLE IF NOT EXISTS history (
        key TEXT,
        value TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
    );
`);

export { progress_dashboard_db, history_db };