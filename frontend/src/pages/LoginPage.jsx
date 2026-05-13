import { useState } from "react";
import { login, register } from "../api/auth";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell";

// Auth-service URL for initiating the Google OAuth2 Authorization Code flow.
// Spring Security handles: /oauth2/authorization/google → Google → /login/oauth2/code/google
// After success, GoogleOAuth2SuccessHandler redirects to /oauth2/callback with JWT tokens.
const GOOGLE_OAUTH_URL = "http://localhost:8081/oauth2/authorization/google";

export default function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [error, setError] = useState("");

  // Read error from URL params (e.g. redirected back after Google auth failure)
  const urlError = new URLSearchParams(window.location.search).get("error");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res =
        mode === "login"
          ? await login(email, password)
          : await register(email, password, role);
      storeAndRedirect(res);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Authentication failed";
      setError(msg);
    }
  }

  function storeAndRedirect(res) {
    localStorage.setItem("hc_access_token", res.accessToken);
    localStorage.setItem("hc_refresh_token", res.refreshToken);
    localStorage.setItem("hc_role", res.role);
    localStorage.setItem("hc_user_id", String(res.userId));
    localStorage.setItem("hc_email", res.email ?? "");
    nav("/jobs");
  }

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left — hero copy */}
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Hire faster. Apply smarter.
          </h1>
          <p className="text-slate-300">
            A modern hiring platform for candidates, recruiters, and admins.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="hc-badge">🚀 Fast Applications</span>
            <span className="hc-badge">📅 Smart Scheduling</span>
            <span className="hc-badge">📊 Recruiter Analytics</span>
            <span className="hc-badge">🔒 Secure Profile</span>
            <span className="hc-badge">📄 Professional Resumes</span>
          </div>
        </div>

        {/* Right — auth card */}
        <div className="hc-card p-6 sm:p-8">
          {/* Mode toggle */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </div>
              <div className="text-sm text-slate-400">
                {mode === "login"
                  ? "Sign in to continue."
                  : "Choose a role and get started."}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className={mode === "login" ? "hc-btn-primary" : "hc-btn-ghost"}
                onClick={() => setMode("login")}
                type="button"
                id="btn-mode-login"
              >
                Login
              </button>
              <button
                className={mode === "register" ? "hc-btn-primary" : "hc-btn-ghost"}
                onClick={() => setMode("register")}
                type="button"
                id="btn-mode-register"
              >
                Register
              </button>
            </div>
          </div>

          {/* ── Continue with Google (Authorization Code flow) ── */}
          <div className="mt-6 space-y-3">
            <a
              id="btn-google-oauth"
              href={GOOGLE_OAUTH_URL}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:border-slate-400 active:scale-95"
            >
              {/* Google "G" logo */}
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {mode === "login" ? "Continue with Google" : "Sign up with Google"}
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500 select-none">
                {mode === "login" ? "or sign in with email" : "or register with email"}
              </span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <div>
              <label htmlFor="input-email" className="text-sm text-slate-200">Email</label>
              <input
                id="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                className="hc-input mt-1"
              />
            </div>

            <div>
              <label htmlFor="input-password" className="text-sm text-slate-200">Password</label>
              <input
                id="input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="Min 8 characters"
                className="hc-input mt-1"
              />
            </div>

            {mode === "register" && (
              <div>
                <label htmlFor="select-role" className="text-sm text-slate-200">Role</label>
                <select
                  id="select-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="hc-select mt-1"
                >
                  <option value="CANDIDATE">CANDIDATE</option>
                  <option value="RECRUITER">RECRUITER</option>
                </select>
              </div>
            )}

            {(error || urlError) && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error || urlError}
              </div>
            )}

            <button id="btn-submit" className="hc-btn-primary mt-1 w-full" type="submit">
              {mode === "login" ? "Login" : "Create account"}
            </button>

            <div className="text-xs text-slate-400">Secure sign-in experience.</div>
          </form>
        </div>
      </div>
    </Shell>
  );
}
