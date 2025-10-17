import Database from "better-sqlite3";

const db = new Database("progress-dashboard.db");

db.pragma("journal_mode = WAL");
db.exec(`
    CREATE TABLE IF NOT EXISTS dataStorage (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOTE NULL DEFAULT (datetime('now'))  
    );
`);

export default db;