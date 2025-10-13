import { Link, Outlet } from "react-router-dom";
import "./App.css"

export default function App() {
    return (
        <div className="layout">

            <div className="header">
                <Link to="/main">Main</Link>
                <Link to="/admin">Admin</Link>
                <Link to="/login">Login</Link>
            </div>


            <div className="page-content">
                <Outlet />
            </div>

        </div>
    );
}