import { Navigate, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import JobsPage from "./pages/JobsPage";
import BookmarksPage from "./pages/BookmarksPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import RecruiterJobsPage from "./pages/RecruiterJobsPage";
import RecruiterApplicantsPage from "./pages/RecruiterApplicantsPage";
import RecruiterAnalyticsPage from "./pages/RecruiterAnalyticsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminSubscriptionMonitorPage from "./pages/AdminSubscriptionMonitorPage";
import AdminJobsPage from "./pages/AdminJobsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import RecruiterProfilePage from "./pages/RecruiterProfilePage";
import InterviewsPage from "./pages/InterviewsPage";

function RequireAuth({ children }) {
  const token = localStorage.getItem("hc_access_token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ allow, children }) {
  const role = localStorage.getItem("hc_role");
  if (!allow.includes(role)) return <Navigate to="/jobs" replace />;
  return children;
}



export default function App() {
  return (
    <NotificationProvider>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Google OAuth2 callback — receives JWT tokens from the backend redirect */}
      <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route
        path="/bookmarks"
        element={
          <RequireAuth>
            <BookmarksPage />
          </RequireAuth>
        }
      />
      <Route
        path="/applications"
        element={
          <RequireAuth>
            <ApplicationsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/interviews"
        element={
          <RequireAuth>
            <InterviewsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <CandidateProfilePage />
          </RequireAuth>
        }
      />

      <Route
        path="/recruiter/jobs"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_RECRUITER", "ROLE_ADMIN"]}>
              <RecruiterJobsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/recruiter/applicants"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_RECRUITER", "ROLE_ADMIN"]}>
              <RecruiterApplicantsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/recruiter/analytics"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_RECRUITER", "ROLE_ADMIN"]}>
              <RecruiterAnalyticsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/subscription"
        element={
          <RequireAuth>
            <SubscriptionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/recruiter/subscription"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_RECRUITER", "ROLE_ADMIN"]}>
              <SubscriptionPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/recruiter/profile"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_RECRUITER", "ROLE_ADMIN"]}>
              <RecruiterProfilePage />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_ADMIN"]}>
              <AdminDashboardPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_ADMIN"]}>
              <AdminUsersPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_ADMIN"]}>
              <AdminJobsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_ADMIN"]}>
              <AdminAnalyticsPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <RequireAuth>
            <RequireRole allow={["ROLE_ADMIN"]}>
              <AdminSubscriptionMonitorPage />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/jobs" replace />} />
    </Routes>
    </NotificationProvider>
  );
}
