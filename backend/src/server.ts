import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import db from "./db.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Prefixes used in db data keys. Allowed = false if key given doesn't start with them.
const ALLOWED_PREFIXES = [
    "integratorName:",
    "swReleaseName:",
    "stageProgress:",
    "stageItemChecked:"
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
            await db.prepare(`
                INSERT INTO dataStorage (key, value, updated_at)
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')
            `).run(key, value);

            // Broadcast to all other clients
            socket.broadcast.emit(
                "dataChange",
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
        const value = db
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