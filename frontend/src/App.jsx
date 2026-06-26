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
import SchedulePage from './pages/SchedulePage';
import SettingsPage from './pages/SettingsPage';
import ModeratorPage from './pages/ModeratorPage';
import NotFoundPage from './pages/NotFoundPage';
import CommunityHub, { CommunityRedirect } from './pages/CommunityHub';
import CommunityTabView from './pages/CommunityTabView';
import PostPage from './pages/PostPage';

function LegacyCommunityRedirect() {
  const { id } = useParams();
  return <Navigate to={`/c/${encodeURIComponent(id)}/chat`} replace />;
}

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

  useEffect(() => {
    if (getToken()) dispatch(fetchMe());
  }, [dispatch]);

  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <Loader label="Warming up UniPulse…" />
      </div>
    );
  }

  return (
    <>
      <Toasts />
      <Routes>
        <Route
          path="/"
          element={token && user ? <Navigate to="/c" replace /> : <LandingPage />}
        />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/c"
          element={
            <ProtectedRoute>
              <CommunityHub />
            </ProtectedRoute>
          }
        >
          <Route index element={<CommunityRedirect />} />
          <Route
            path="moderator"
            element={
              <ProtectedRoute moderatorOnly>
                <ModeratorPage />
              </ProtectedRoute>
            }
          />
          <Route path=":communityId/posts/:postId" element={<PostPage />} />
          <Route path=":communityId/:tab" element={<CommunityTabView />} />
        </Route>

        <Route path="/communities" element={<Navigate to="/c" replace />} />
        <Route path="/communities/:id" element={<LegacyCommunityRedirect />} />
        <Route path="/moderator" element={<Navigate to="/c/moderator" replace />} />

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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
