import Database from "better-sqlite3";

// The 'data' folder is inside the Docker container, not the host machine.
const db = new Database("/data/progress-dashboard.db");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS dataStorage (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOTE NULL DEFAULT (datetime('now'))  
    );
`);

export default db;