import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { progress_dashboard_db, history_db } from "./db";
import { createServer } from "http";
import { Server } from "socket.io";

// Prefixes used in db data keys. Allowed = false if key given doesn't start with them.
const ALLOWED_PREFIXES = [
    "integratorName:",
    "swReleaseName:",
    "stageProgress:",
    "stageItemChecked:",
    "history:",
]

function prefixAllowed(key: string) {
    return ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
}

// Create an Express app and a HTTP server to wrap it.
// Client Request → HTTP Server → Express App → Routes
//               ↑               ↑             ↑
//          (port 4000)    (createServer)   (app.get etc.)
const app = express();
const httpServer = createServer(app);

// Initialise Socket.IO with CORS settings matching that of Express
const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
        methods: ["GET", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

// Express middleware
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

// Socket.IO event handlers
io.on("connection", (socket) => {
    // Listen for data updates from clients
    socket.on("dataUpdate", ({ key, value }) => {
        // Broadcast the update to all other connected clients
        socket.broadcast.emit("dataUpdate", { key, value });
    });
    
    console.log("Client connected.");

    // Listen for data updates
    socket.on("dataUpdate", async ({key, value}) => {

        if (prefixAllowed(key)) {

            // Update database
            await progress_dashboard_db.prepare(`
                INSERT INTO dataStorage (key, value, updated_at)
                VALUES (?, ?, datetime('now', '+8 hours'))
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')
            `).run(key, value);

            // Broadcast to all other clients
            socket.broadcast.emit(
                "dataChange",
                {key, value}
            );

        }

    });

    // Listen to history writes
    socket.on("historyWrite", async ({key, value}) => {

        if (prefixAllowed(key)) {

            // Update history database
            await history_db.prepare(`
                INSERT INTO history (key, value, updated_at)
                VALUES (?, ?, datetime('now', '+8 hours'))
            `).run(key, value);

            // Broadcast to all other clients
            socket.broadcast.emit(
                "historyAdded",
                {key, value}
            );

        }

    });

    socket.on("disconnect", () => {
        console.log("Client disconnected.")
    });

});

// Use httpServer.listen instead of app.listen
const PORT = 4000; // Backend running on this port, so we use this port with the address when testing on browser.

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on http://0.0.0.0:${PORT}`);
});


// =========================== API endpoints =========================== //

// When the address is visited, this message will be shown.
app.get("/", (_req, res) => {
    res.send("✅ Backend is running successfully!");
});

// --- Data Storage Endpoints --- //

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
        const value = progress_dashboard_db
            .prepare("SELECT value FROM dataStorage WHERE key = ?")
            .pluck()
            .get(key) as string | undefined;
        res.json(
            {
                value: value ?? null
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
        progress_dashboard_db.prepare(`
            INSERT INTO dataStorage (key, value, updated_at)
            VALUES (?, ?, datetime('now', '+8 hours'))
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
        progress_dashboard_db.prepare("DELETE FROM dataStorage WHERE key = ?").run(key);
        res.json(
            {
                ok: true,
            }
        )
    }

});

// --- History Endpoints --- //

// GET history
// Read a specific entry's history from an API endpoint.

app.get("/api/history/:key", (req, res) => {

    const key = req.params.key;

    if (!prefixAllowed(key)) {
        return res.status(400).json(
            {
                error: "Unknown key"
            }
        );
    } else {
        const history = history_db
            .prepare("SELECT value, updated_at FROM history WHERE key = ? ORDER BY updated_at DESC")
            .all(key) as { value: string, updated_at: string }[];
        res.json(
            {
                history: history
            }
        )
    }

});

// POST history
// Add a new entry to an entry's history from an API endpoint.
app.post("/api/history/:key", (req, res) => {

    const key = req.params.key;

    if (!prefixAllowed(key)) {
        return res.status(400).json(
            {
                error: "Unknown key"
            }
        );
    } else {
        const value = String(req.body?.value ?? "");
        history_db.prepare(`
            INSERT INTO history (key, value, updated_at)
            VALUES (?, ?, datetime('now', '+8 hours'))
        `).run(key, value);
        res.json(
            {
                ok: true
            }
        );
    }

});

