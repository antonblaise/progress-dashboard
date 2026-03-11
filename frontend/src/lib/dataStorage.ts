import { socket } from "./socket";

// The backend URL
const BACKEND = `${window.location.protocol}//${window.location.hostname}:4000`;

// A storage variable to store all data, which will eventually be sent to the backend.
export const dataStorage = {

	async getData(key: string): Promise<any | null> {
		try {
			const res = await fetch(`${BACKEND}/api/data/${encodeURIComponent(key)}`);
			const json = await res.json();
			return json ?? null;
		} catch {
			return null;
		}
	},

	async setData(key: string, value: string): Promise<void> {
		const updated_at = new Date().toISOString();
		try {
			await fetch(
				`${BACKEND}/api/data/${encodeURIComponent(key)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ value, updated_at })
				}
			);
			// Real-time Socket.IO update
			socket.emit("dataUpdate", { key, value, updated_at });
		} catch {
			// Ignore write errors
		}
	},

	// (4 Mar 2026) Antonius: We need every data to be kept for history and audit purpose, so we will not delete any data.
	// async removeData(key: string): Promise<void> {
	// 	try {
	// 		await fetch(
	// 			`${BACKEND}/api/data/${encodeURIComponent(key)}`,
	// 			{
	// 				method: "DELETE"
	// 			}
	// 		);
    //         // Real-time Socket.IO update for deletion
    //         socket.emit("dataUpdate", { key, value: null });
	// 	} catch {
	// 		// Ignore delete errors
	// 	}
	// }

};