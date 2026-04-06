import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

const BACKEND = `${window.location.protocol}//${window.location.hostname}:4000`;

type AuthContextValue = {
	isAuthenticated: boolean;
	username: string | null;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [username, setUsername] = useState<string | null>(null);

	useEffect(() => {
		void refreshSession();
	}, []);

	const refreshSession = async () => {
		try {
			const response = await fetch(`${BACKEND}/api/auth/session`, {
				credentials: "include",
			});
			const payload = await response.json();
			setUsername(payload?.authenticated ? payload.username ?? null : null);
		} catch {
			setUsername(null);
		}
	};

	const login = async (inputUsername: string, password: string) => {
		try {
			const response = await fetch(`${BACKEND}/api/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					username: inputUsername,
					password,
				}),
			});

			if (!response.ok) {
				setUsername(null);
				return false;
			}

			const payload = await response.json();
			setUsername(payload?.username ?? inputUsername);
			return true;
		} catch {
			setUsername(null);
			return false;
		}
	};

	const logout = async () => {
		try {
			await fetch(`${BACKEND}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
		} catch {
			// Ignore logout errors and clear local state anyway.
		}

		setUsername(null);
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated: username !== null,
				username,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}