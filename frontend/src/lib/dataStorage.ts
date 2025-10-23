import { socket } from "./socket";

// The backend URL
const BACKEND = `${window.location.protocol}//${window.location.hostname}:4000`;

// A storage variable to store all data, which will eventually be sent to the backend.
export const dataStorage = {

	async get(key: string): Promise<string | null> {
		try {
			const res = await fetch(`${BACKEND}/api/data/${encodeURIComponent(key)}`);
			const json = await res.json();
			return json?.value ?? null;
		} catch {
			return null;
		}
	},

	async set(key: string, value: string): Promise<void> {
		try {
			await fetch(
				`${BACKEND}/api/data/${encodeURIComponent(key)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ value })
				}
			);
			// Real-time Socket.IO update
			socket.emit("dataUpdate", { key, value });
		} catch {
			// Ignore write errors
		}
	},

	async remove(key: string): Promise<void> {
		try {
			await fetch(
				`${BACKEND}/api/data/${encodeURIComponent(key)}`,
				{
					method: "DELETE"
				}
			);
            // Real-time Socket.IO update for deletion
            socket.emit("dataUpdate", { key, value: null });
		} catch {
			// Ignore delete errors
		}
	}

};