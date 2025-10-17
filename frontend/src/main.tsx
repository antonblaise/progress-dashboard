// TSX file for the main entry point of the React application, including routing.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App";
import Main from "./pages/Main";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Stage from "./pages/Stage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<Navigate to="/main" />} />

                    <Route path="/main" element={<Main />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />

                    <Route 
                        path="/checklist/:carline/:stage" 
                        element={<Stage />} 
                    />
                    <Route
                        path="/checklist/:carline"
                        element={
                            (() => {
                                const carline = location.pathname.split("/")[2];
                                return <Navigate to={`/checklist/${carline}/stage-1`} replace />;
                            })()
                        }
                    />
                    <Route
                        path="/checklist"
                        element={
                            (() => {
                                return <Navigate to="/main" />;
                            })()
                        }
                    />

                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);