import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./lib/auth.tsx";
import "./App.css"

export default function App() {
    const { isAuthenticated, logout } = useAuth();
    const signedInLabel = isAuthenticated
        ? "Signed in"
        : "View only";

    return (
        <div className="layout">

            <div className="header">
                <Link to="/home">Home</Link>
                <Link to="/login">Login</Link>
                <div className="auth-status">
                    <span className={isAuthenticated ? "auth-state auth-true" : "auth-state auth-false"}>{signedInLabel}</span>
                    {isAuthenticated && (
                        <button type="button" className="auth-button" onClick={logout}>Logout</button>
                    )}
                </div>
            </div>

            <div className="page-content">
                <Outlet />
            </div>

        </div>
    );
}