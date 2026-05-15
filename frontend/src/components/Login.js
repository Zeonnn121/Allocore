import React, { useState } from "react";

function Login({ setIsLoggedIn }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [inviteCode, setInviteCode] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setInviteCode("");
    setOrganizationName("");
  };

  const login = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://allocore-backend.onrender.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error("Login failed. Check credentials and try again.");
      }

      const data = await res.json();

      if (!data.token) {
        throw new Error("Token not received from server.");
      }

      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
    } catch (loginError) {
      setError(loginError.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("https://allocore-backend.onrender.com/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          inviteCode,
          organizationName
        })
      });

      const message = await res.text();
      if (!res.ok) {
        throw new Error(message || "Registration failed");
      }

      alert(message || "Registration successful.");
      setIsRegister(false);
      resetForm();
    } catch (registerError) {
      setError(registerError.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError("");
    setIsRegister((current) => !current);
  };

  return (
    <div className="auth-card">
      <div className="auth-card__header">
        <h2>{isRegister ? "Create Organization Access" : "Welcome back"}</h2>
        <p>
          {isRegister
            ? "Join your organization with the correct invite code and role."
            : "Sign in to access your AdminOS workspace."}
        </p>
      </div>

      <form className="auth-form" onSubmit={isRegister ? register : login}>
        {isRegister && (
          <>
            <label>
              Full Name
              <input
                placeholder="Jane Doe"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label>
              Organization Name
              <input
                placeholder="Acme Health"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label>
                Invite Code
                <input
                  placeholder="ORG-INVITE"
                  value={inviteCode}
                  required
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </label>

              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="USER">Customer</option>
                  <option value="STAFF">Service Provider</option>
                  <option value="ORG_ADMIN">Admin</option>
                </select>
              </label>
            </div>
          </>
        )}

        <label>
          Email
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="status status--error">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
        </button>
      </form>

      <button className="btn btn--ghost" onClick={switchMode} type="button">
        {isRegister
          ? "Already have an account? Go to Login"
          : "Need organization access? Register"}
      </button>
    </div>
  );
}

export default Login;