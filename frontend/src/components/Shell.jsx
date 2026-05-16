import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { getProfileByUserId } from "../api/profiles";
import { getCurrentSubscription } from "../api/subscriptions";
import NotificationCenter from "./NotificationCenter";

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function Shell({ children }) {
  const role = localStorage.getItem("hc_role");
  const token = localStorage.getItem("hc_access_token");
  const userId = localStorage.getItem("hc_user_id");
  const email = localStorage.getItem("hc_email");
  const isAuthenticated = Boolean(token);
  const isCandidate = role === "ROLE_CANDIDATE";
  const isRecruiter = role === "ROLE_RECRUITER";
  const isAdmin = role === "ROLE_ADMIN";
  const [displayName, setDisplayName] = useState(localStorage.getItem("hc_display_name") || "");

  useEffect(() => {
    let cancelled = false;
    async function loadDisplayName() {
      if (!userId) return;
      try {
        const profile = await getProfileByUserId(Number(userId));
        const name = profile?.fullName || profile?.recruiterName || "";
        if (!cancelled && name) {
          setDisplayName(name);
          localStorage.setItem("hc_display_name", name);
        }
      } catch {
        // Keep fallback name from local storage or email.
      }
    }
    loadDisplayName();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const roleLabel = useMemo(() => (role ?? "ROLE_UNKNOWN").replace("ROLE_", ""), [role]);
  const [currentPlan, setCurrentPlan] = useState(localStorage.getItem("hc_current_plan"));

  useEffect(() => {
    let cancelled = false;
    async function loadPlan() {
      if (!userId || !role) return;
      try {
        const subRole = role === "ROLE_RECRUITER" ? "RECRUITER" : "CANDIDATE";
        const sub = await getCurrentSubscription(Number(userId), subRole);
        if (!cancelled) {
          const plan = sub?.plan || "FREE";
          setCurrentPlan(plan);
          localStorage.setItem("hc_current_plan", plan);
        }
      } catch (e) {
        console.error("Failed to load plan", e);
      }
    }
    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [userId, role]);

  const planLabel = useMemo(() => {
    if (isAdmin) return null;
    const plan = currentPlan || localStorage.getItem("hc_current_plan");
    if (!plan) return null; 
    if (plan === "FREE") return "Free";
    return plan === "MONTHLY_99" ? "Standard" : "Premium";
  }, [currentPlan, isAdmin]);

  function onLogout() {
    localStorage.removeItem("hc_access_token");
    localStorage.removeItem("hc_refresh_token");
    localStorage.removeItem("hc_role");
    localStorage.removeItem("hc_user_id");
    localStorage.removeItem("hc_display_name");
    localStorage.removeItem("hc_email");
    localStorage.removeItem("hc_current_plan");
    window.location.href = "/login";
  }

  return (
    <div className="min-h-full">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-160px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/20 to-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-220px] h-[520px] w-[520px] rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="hc-container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 text-white shadow-soft">
              HC
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">HireConnect</div>
              <div className="text-xs text-slate-400">Find your next opportunity</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 sm:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-sm transition",
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                )
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-sm transition",
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                )
              }
            >
              Jobs
            </NavLink>
            {token && isCandidate && (
              <>
                <NavLink
                  to="/bookmarks"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Bookmarks
                </NavLink>
                <NavLink
                  to="/applications"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Applications
                </NavLink>
                <NavLink
                  to="/interviews"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Interviews
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/subscription"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Subscription
                </NavLink>
              </>
            )}

            {token && isRecruiter && (
              <>
                <NavLink
                  to="/recruiter/jobs"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  My Jobs
                </NavLink>
                <NavLink
                  to="/recruiter/profile"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Profile
                </NavLink>
                <NavLink
                  to="/recruiter/applicants"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Applicants
                </NavLink>
                <NavLink
                  to="/recruiter/analytics"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Analytics
                </NavLink>
                <NavLink
                  to="/recruiter/subscription"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                    )
                  }
                >
                  Subscription
                </NavLink>
              </>
            )}

            {token && isAdmin && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-indigo-500/80 text-white" : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                    )
                  }
                >
                  ⚙️ Admin Panel
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && <NotificationCenter />}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/30 text-xs font-semibold text-indigo-100">
                  {(displayName || email || "U").trim().charAt(0).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-medium text-white">
                    {displayName || email || `User ${userId}`}
                  </div>
                  <div className="text-[11px] flex items-center gap-2">
                    <span className="text-slate-400">{roleLabel}</span>
                    {planLabel && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                        planLabel === "Free" 
                          ? "bg-slate-500/20 text-slate-400 border-slate-500/30" 
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      )}>
                        {planLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Link className="hc-btn-ghost" to="/login">
                Login
              </Link>
            )}
            {isAuthenticated && (
              <button className="hc-btn-ghost" type="button" onClick={onLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="hc-container py-10">{children}</main>
    </div>
  );
}

