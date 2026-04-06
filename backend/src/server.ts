import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { progress_dashboard_db, history_db } from "./db";
import { authUsers } from "./authUsers";
import { createServer } from "http";
import { Server } from "socket.io";
import crypto from "crypto";

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

const SESSION_COOKIE_NAME = "progress_dashboard_session";
const sessionStore = new Map<string, string>();

// Create a session for the authenticated user by generating a random session token,
// storing it in the session store with the associated username hash,
// and setting a cookie in the response with the session token.
function createSession(res: express.Response, usernameHash: string) {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    sessionStore.set(sessionToken, usernameHash);
    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,                      // Set to true if using HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000,    // 7 days in milliseconds
    });
}

// Clear the session associated with the request by deleting the session token from the session store and clearing the cookie in the response.
function clearSession(req: express.Request, res: express.Response) {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionToken) {
        sessionStore.delete(sessionToken);
    }

    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
    });
}

// Get the authenticated user's username hash by looking up the session token from the request cookies in the session store.
function getAuthenticatedUser(req: express.Request) {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionToken) {
        return null;
    }

    return sessionStore.get(sessionToken) ?? null;
}

// Middleware to require authentication for protected routes.
// It checks if the user is authenticated by looking up the session token in the cookies
// and returns the username hash if authenticated, or sends a 401 response if not authenticated.
function requireAuth(req: express.Request, res: express.Response) {
    const usernameHash = getAuthenticatedUser(req);
    if (!usernameHash) {
        res.status(401).json({ error: "Authentication required" });
        return null;
    }

    return usernameHash;
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
        methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
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
        methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
));

// Socket.IO event handlers
io.on("connection", (socket) => {
    console.log("Client connected.");

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

// --- Authentication Endpoints --- //

// This endpoint checks if the user is authenticated by looking up the session token in the cookies and returns the authentication status and username if authenticated.
app.get("/api/auth/session", (req, res) => {
    const usernameHash = getAuthenticatedUser(req);
    res.json({
        authenticated: usernameHash !== null,
        username: usernameHash,
    });
});

// This endpoint handles login attempts.
// It hashes the provided username and password and checks if they match any entry in the list of allowed users.
// If a match is found, a session is created; otherwise, an error response is returned.
app.post("/api/auth/login", (req, res) => {
    const usernameHash = crypto.createHash("sha256").update(String(req.body?.username ?? "")).digest("hex");
    const passwordHash = crypto.createHash("sha256").update(String(req.body?.password ?? "")).digest("hex");

    console.log("[auth] login attempt", {
        usernameHash,
        passwordHash,
    });

    // Check if the username and password hashes match any entry in the list of allowed users.
    const matchedUser = authUsers.find(
        (user) => user.username === usernameHash && user.password === passwordHash,
    );

    if (!matchedUser) {
        clearSession(req, res);
        return res.status(401).json({ ok: false, error: "Invalid username or password" });
    }

    createSession(res, matchedUser.username);
    return res.json({ ok: true, username: matchedUser.username });
});

// This endpoint handles logout attempts by clearing the session associated with the request and returning a success response.
app.post("/api/auth/logout", (req, res) => {
    clearSession(req, res);
    res.json({ ok: true });
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

    if (!requireAuth(req, res)) {
        return;
    }

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
        io.emit("dataChange", { key, value, updated_at: timestamp });
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

    if (!requireAuth(req, res)) {
        return;
    }

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

    if (!requireAuth(req, res)) {
        return;
    }

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
        io.emit("historyAdded", { key, value, updated_at: timestamp });
        res.json(
            {
                ok: true
            }
        );
    }

});

