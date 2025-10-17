// The backend URL
export const BACKEND = `${window.location.protocol}//${window.location.hostname}:4000`;

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
			const res = await fetch(
				`${BACKEND}/api/data/${encodeURIComponent(key)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ value })
				}
			);
			const json = await res.json();
			return json?.value ?? null; 
		} catch {
			// Ignore write errors
		}
	},

	async remove(key: string): Promise<void> {
		try {
			const res = await fetch(
				`${BACKEND}/api/data/${encodeURIComponent(key)}`,
				{
					method: "DELETE"
				}
			);
			const json = await res.json();
			return json?.value ?? null;
		} catch {
			// Ignore delete errors
		}
	}

};