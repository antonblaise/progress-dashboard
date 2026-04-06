import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.tsx";

export default function Login() {
	const navigate = useNavigate();
	const { isAuthenticated, login, logout } = useAuth();
	const [formUsername, setFormUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);

		const success = await login(formUsername, password);

		setIsSubmitting(false);

		if (!success) {
			setError("Invalid username or password.");
			return;
		}

		navigate("/home");
	};

	return (
		<div className="login-page">
			<div className="login-card">
				<h1>Login</h1>
				<img className="login-gif" src={
					isAuthenticated
						? "https://media.tenor.com/QVytPvhOBosAAAAi/wiggle-swaying.gif"
						: "https://c.tenor.com/aYco_g9fruYAAAAd/tenor.gif"
				} alt="omega-flowey"/>
				<p>
					{isAuthenticated
						? "You are already signed in."
						: "Log in for write access."}
				</p>

				{isAuthenticated ? (
					<button type="button" onClick={logout}>Logout</button>
				) : (
					<form className="login-form" onSubmit={handleSubmit}>
						<input
							type="text"
							placeholder="Username"
							value={formUsername}
							onChange={(event) => setFormUsername(event.target.value)}
							autoComplete="username"
						/>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							autoComplete="current-password"
						/>
						{error && <p className="login-error">{error}</p>}
						<button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Signing in..." : "Sign in"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
