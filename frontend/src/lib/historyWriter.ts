// The backend URL
const BACKEND = `${window.location.protocol}//${window.location.hostname}:4000`;

export const history = {

	async getHistory(key: string): Promise<{ value: string, updated_at: string }[]> {
		try {
			const res = await fetch(`${BACKEND}/api/history/${encodeURIComponent(key)}`);
			const json = await res.json();
			return json?.history ?? [];
		} catch {
			return [];
		}
	},

	async writeHistory(key: string, value: string): Promise<void> {
		try {
			await fetch(
				`${BACKEND}/api/history/${encodeURIComponent(key)}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
					body: JSON.stringify({ value })
				}
			);
		} catch {
			// Ignore write errors
		}
	}

};