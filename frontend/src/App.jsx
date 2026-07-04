/**
 * APP — ROOT COMPONENT
 * ----------------------------------------------------------------------------
 * The top-level React component that defines the entire routing structure and
 * handles session restoration on page load.
 *
 * Session restoration:
 *   On mount, if a JWT exists in localStorage, dispatches fetchMe() to load
 *   the user profile. While resolving, a full-screen Loader is shown.
 *
 * Routing structure:
 *   /                       → Landing page (or redirect to /c if logged in)
 *   /signup                 → Signup page
 *   /verify                 → OTP verification page
 *   /login                  → Login page
 *   /forgot-password        → Forgot password page
 *   /reset-password         → Reset password page
 *   /onboarding             → Post-signup community selection (protected)
 *   /c                      → Community hub (protected, with nested routes):
 *     /c                    → Auto-redirect to default community
 *     /c/moderator          → Moderator dashboard (moderator-only)
 *     /c/events             → All events feed
 *     /c/events/:eventId    → Single event detail
 *     /c/messages           → User-to-mod messages
 *     /c/:communityId/posts/:postId  → Single post detail
 *     /c/:communityId/events/:eventId → Community event detail
 *     /c/:communityId/:tab  → Community tab view (chat, posts, events, etc.)
 *   /schedule               → Schedule upload page (protected, standalone layout)
 *   /settings               → User settings page (protected, standalone layout)
 *   /communities            → Legacy redirect → /c
 *   /communities/:id        → Legacy redirect → /c/:id/chat
 *   /moderator              → Legacy redirect → /c/moderator
 *   *                       → 404 Not Found page
 *
 * Layout:
 *   - Community hub routes use CommunityHub layout (sidebar + content)
 *   - Schedule/Settings use AppLayout (Navbar + centered content)
 *   - Auth pages have no shared layout wrapper
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { fetchMe } from './features/auth/authSlice';
import { getToken } from './lib/api';

import Navbar from './components/Navbar';
import Toasts from './components/Toasts';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import VerifyPage from './pages/VerifyPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CommunityOnboardingPage from './pages/CommunityOnboardingPage';
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import ModeratorPage from './pages/ModeratorPage';
import NotFoundPage from './pages/NotFoundPage';
import CommunityHub, { CommunityRedirect } from './pages/CommunityHub';
import CommunityTabView from './pages/CommunityTabView';
import PostPage from './pages/PostPage';
import EventPage from './pages/EventPage';
import AllEventsPage from './pages/AllEventsPage';
import AllEventsFeedPage from './pages/AllEventsFeedPage';
import UserMessagesPage from './pages/UserMessagesPage';

/** Redirect legacy /communities/:id URLs to the new /c/:id/chat format. */
function LegacyCommunityRedirect() {
  const { id } = useParams();
  return <Navigate to={`/c/${encodeURIComponent(id)}/chat`} replace />;
}

/** Standalone page layout with top navbar and centered content area. */
function AppLayout() {
  return (
    <div className="min-h-screen bg-base-200/40">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { booting, token, user } = useSelector((s) => s.auth);

  // On mount, attempt to restore the user session from the stored JWT.
  useEffect(() => {
    if (getToken()) dispatch(fetchMe());
  }, [dispatch]);

  // Show a full-screen loader while the stored token is being validated.
  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <Loader label="Loading communities…" showLogo />
      </div>
    );
  }

  return (
    <>
      {/* Global toast notifications (errors, success notices from any slice). */}
      <Toasts />
      <Routes>
        {/* --- Public auth routes --- */}
        <Route
          path="/"
          element={token && user ? <Navigate to="/c" replace /> : <LandingPage />}
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* --- Post-signup onboarding (protected) --- */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <CommunityOnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* --- Community hub (protected, sidebar layout) --- */}
        <Route
          path="/c"
          element={
            <ProtectedRoute>
              <CommunityHub />
            </ProtectedRoute>
          }
        >
          {/* Default: redirect to the user's first community. */}
          <Route index element={<CommunityRedirect />} />
          {/* Moderator dashboard (requires moderator role). */}
          <Route
            path="moderator"
            element={
              <ProtectedRoute moderatorOnly>
                <ModeratorPage />
              </ProtectedRoute>
            }
          />
          {/* Global events feed + individual event detail. */}
          <Route path="events" element={<AllEventsPage />}>
            <Route index element={<AllEventsFeedPage />} />
            <Route path=":eventId" element={<EventPage />} />
          </Route>
          {/* User-to-moderator messages. */}
          <Route path="messages" element={<UserMessagesPage />} />
          {/* Community-scoped post and event detail pages. */}
          <Route path=":communityId/posts/:postId" element={<PostPage />} />
          <Route path=":communityId/events/:eventId" element={<EventPage />} />
          {/* Community tab view (chat, posts, events, etc.). */}
          <Route path=":communityId/:tab" element={<CommunityTabView />} />
        </Route>

        {/* --- Legacy redirects for old URL formats --- */}
        <Route path="/communities" element={<Navigate to="/c" replace />} />
        <Route path="/communities/:id" element={<LegacyCommunityRedirect />} />
        <Route path="/moderator" element={<Navigate to="/c/moderator" replace />} />

        {/* --- Standalone pages with AppLayout (navbar + centered content) --- */}
        <Route element={<AppLayout />}>
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* --- 404 catch-all --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
