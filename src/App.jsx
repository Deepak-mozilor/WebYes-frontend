import { useState } from "react";
import GuestPage from "./pages/GuestPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("guest"); // "guest" | "login"

  function handleLogin(t) {
    localStorage.setItem("token", t);
    setToken(t);
    setView("guest");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setView("guest");
  }

  if (token) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (view === "login") {
    return <Login onLogin={handleLogin} onBack={() => setView("guest")} />;
  }

  return <GuestPage onLoginClick={() => setView("login")} />;
}
