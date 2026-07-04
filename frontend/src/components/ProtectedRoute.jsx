/**
 * ProtectedRoute — route guard that redirects unauthenticated users to /login
 * and optionally restricts access to moderators only.
 *
 * While the app is still resolving the stored JWT token (booting phase),
 * renders nothing to prevent a flash of the login page.
 *
 * Props:
 * @param {ReactNode} children      — the protected page content
 * @param {boolean}   moderatorOnly — if true, non-moderators are redirected to /c
 */
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, moderatorOnly = false }) {
  const { token, user, booting } = useSelector((s) => s.auth);
  const location = useLocation();

  if (booting) return null;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (moderatorOnly && !user?.moderator) {
    return <Navigate to="/c" replace />;
  }

  return children;
}
