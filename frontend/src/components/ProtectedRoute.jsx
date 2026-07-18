/**
 * ProtectedRoute — route guard that redirects unauthenticated users to /login.
 */
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import Loader from './Loader';

export default function ProtectedRoute({ children, moderatorOnly = false }) {
  const { token, user, booting } = useSelector((s) => s.auth);
  const location = useLocation();

  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center bg-base-200">
        <Loader label="Loading…" showLogo />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (moderatorOnly && !user.moderator) {
    return <Navigate to="/c" replace />;
  }

  return children;
}
