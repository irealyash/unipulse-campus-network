import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Guards routes that require a logged-in user. While the app is still resolving
 * a stored token (booting) we render nothing to avoid a flash. `moderatorOnly`
 * additionally restricts a route to moderators.
 */
export default function ProtectedRoute({ children, moderatorOnly = false }) {
  const { token, user, booting } = useSelector((s) => s.auth);
  const location = useLocation();

  if (booting) return null;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (moderatorOnly && !user?.moderator) {
    return <Navigate to="/communities" replace />;
  }

  return children;
}
