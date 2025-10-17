import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import db from "./db.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: true,
        credentials: true,
        methods: ["GET", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
));

// When the address is visited, this message will be shown.
app.get("/", (_req, res) => {
    res.send("✅ Backend is running successfully!");
});

const PORT = 4000; // Backend running on this port, so we use this port with the address when testing on browser.

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on http://0.0.0.0:${PORT}`);
});


const ALLOWED_PREFIXES = [
    "integratorName:",
    "swReleaseName:",
    "stageProgress:",
    "stageItemChecked:"
]

function prefixAllowed(key: string) {
    return ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
}

// GET value
// Read data from an API endpoint.
app.get("/api/data/:key", (req, res) => {

    const key = req.params.key;

    if (!prefixAllowed(key)) {
        return res.status(400).json(
            {
                error: "Unknown key"
            }
        );
    } else {
        const row = db.prepare("SELECT value FROM dataStorage WHERE key = ?").get(key);
        res.json(
            {
                value: row?.value ?? null
            }
        )
    }

});

// PUT value
// Write data to an API endpoint.
app.put("/api/data/:key", (req, res) => {

    const key = req.params.key;

    if(!prefixAllowed(key)) {
        return res.status(400).json(
            {
                error: "Unknown key"
            }
        )
    } else {
        const value = String(req.body?.value ?? "");
        db.prepare(`
            INSERT INTO dataStorage (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')
        `).run(key, value);
        res.json(
            {
                ok: true
            }
        );
    }

});

// DELETE value
// Delete data from an API endpoint.
app.delete("/api/data/:key", (req, res) => {

    const key = req.params.key;

    if (!prefixAllowed(key)) {
        return res.status(400).json(
            {
                error: "Unknown key"
            }
        );
    } else {
        db.prepare("DELETE FROM dataStorage WHERE key = ?").run(key);
        res.json(
            {
                ok: true,
            }
        )
    }

});