import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        origin: "http://localhost:5173", // React frontend URL uses this port to talk to backend.
        credentials: true
    }
));

// When the address is visited, this message will be shown.
app.get("/", (_req, res) => {
    res.send("✅ Backend is running successfully!");
});

const PORT = 4000; // Backend running on this port, so we use this port with the address when testing on browser.

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});

