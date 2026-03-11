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

// Helper function to format timestamp as YYYY-MM-dd HH:mm:ss in GMT+8
function getFormattedTimestamp(): string {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
            const timestamp = getFormattedTimestamp();
            await progress_dashboard_db.prepare(`
                INSERT INTO dataStorage (key, value, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            `).run(key, value, timestamp);

            // Retrieve the stored timestamp to broadcast
            const row = progress_dashboard_db
                .prepare("SELECT updated_at FROM dataStorage WHERE key = ?")
                .get(key) as { updated_at?: string } | undefined;
            const updated_at = row?.updated_at ?? "";

            // Broadcast to all other clients
            socket.broadcast.emit(
                "dataChange",
                {key, value, updated_at}
            );

        }

    });

    // Listen to history writes
    socket.on("historyWrite", async ({key, value}) => {

        if (prefixAllowed(key)) {

            // Update history database
            const timestamp = getFormattedTimestamp();
            await history_db.prepare(`
                INSERT INTO history (key, value, updated_at)
                VALUES (?, ?, ?)
            `).run(key, value, timestamp);

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
        const row = progress_dashboard_db
            .prepare("SELECT value, updated_at FROM dataStorage WHERE key = ?")
            .get(key) as { value?: string, updated_at?: string } | undefined;
        res.json(
            {
                value: row?.value ?? null,
                updated_at: row?.updated_at ?? null
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
        const timestamp = getFormattedTimestamp();
        progress_dashboard_db.prepare(`
            INSERT INTO dataStorage (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
        `).run(key, value, timestamp);
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
        const timestamp = getFormattedTimestamp();
        history_db.prepare(`
            INSERT INTO history (key, value, updated_at)
            VALUES (?, ?, ?)
        `).run(key, value, timestamp);
        res.json(
            {
                ok: true
            }
        );
    }

});

