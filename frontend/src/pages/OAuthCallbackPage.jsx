import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * OAuthCallbackPage
 *
 * After Google OAuth2 succeeds, the backend's GoogleOAuth2SuccessHandler redirects the
 * browser here with HireConnect JWT tokens as URL query parameters:
 *
 *   /oauth2/callback?accessToken=...&refreshToken=...&role=...&userId=...&email=...
 *
 * Uses useSearchParams() (React Router v7 idiomatic) instead of window.location.search
 * to reliably read the query params after the redirect.
 */
export default function OAuthCallbackPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken  = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const role         = searchParams.get("role");
    const userId       = searchParams.get("userId");
    const email        = searchParams.get("email") ?? "";

    // Debug: log what we received (visible in browser DevTools console)
    console.log("[OAuthCallback] received params:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      role,
      userId,
      email,
      fullSearch: window.location.search,
    });

    if (!accessToken || !refreshToken || !role || !userId) {
      console.error("[OAuthCallback] Missing token data — redirecting to login with error");
      nav("/login?error=Google+sign-in+failed%3A+missing+token+data", { replace: true });
      return;
    }

    localStorage.setItem("hc_access_token", accessToken);
    localStorage.setItem("hc_refresh_token", refreshToken);
    localStorage.setItem("hc_role", role);
    localStorage.setItem("hc_user_id", userId);
    localStorage.setItem("hc_email", email);

    nav("/jobs", { replace: true });
  }, [searchParams, nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-white">
        <svg
          className="h-10 w-10 animate-spin text-indigo-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-300 text-sm">Completing Google sign-in…</p>
      </div>
    </div>
  );
}
