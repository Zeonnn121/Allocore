import React, { useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import "./App.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const hasValidToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  try {
    const payload = jwtDecode(token);
    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 > Date.now();
  } catch (error) {
    localStorage.removeItem("token");
    return false;
  }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasValidToken());
  const appTitle = useMemo(() => "AdminOS", []);

  return (
    <div className="app-shell">
      <div className="app-shell__container">
        <header className="app-shell__header">
          <h1>{appTitle}</h1>
          <p>Role-Based Resource Administration Platform</p>
        </header>

        {!isLoggedIn ? (
          <Login setIsLoggedIn={setIsLoggedIn} />
        ) : (
          <Dashboard setIsLoggedIn={setIsLoggedIn} />
        )}
      </div>
    </div>
  );
}

export default App;