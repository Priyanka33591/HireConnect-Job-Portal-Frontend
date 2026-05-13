import { http } from "./http";

export async function login(email, password) {
  const { data } = await http.post("/auth/login", { email, password });
  return data;
}

export async function register(email, password, role) {
  const { data } = await http.post("/auth/register", { email, password, role });
  return data;
}

// NOTE: Google OAuth2 is handled via a full browser redirect — NOT an API call.
// Click "Continue with Google" on LoginPage → http://localhost:8081/oauth2/authorization/google
// → Google → http://localhost:8081/login/oauth2/code/google (Spring Security callback)
// → GoogleOAuth2SuccessHandler → http://localhost:5173/oauth2/callback?accessToken=...
// → OAuthCallbackPage stores tokens and navigates to /jobs
