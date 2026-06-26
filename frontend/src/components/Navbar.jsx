import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import { ShieldIcon, LogoutIcon, SparkleIcon } from './icons';

/**
 * Top navigation bar. Shows the brand, primary links (Communities, and the
 * Moderator tab for moderators only), the theme switcher, and a user menu.
 */
export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `btn btn-ghost btn-sm rounded-full ${isActive ? 'btn-active text-primary' : ''}`;

  return (
    <div className="navbar bg-base-100/80 backdrop-blur sticky top-0 z-50 border-b border-base-200 px-3 sm:px-6">
      <div className="flex-1">
        <Link to="/c" className="btn btn-ghost text-xl gap-2 normal-case">
          <span className="text-primary">
            <SparkleIcon className="text-2xl" />
          </span>
          <span className="font-extrabold tracking-tight">
            Uni<span className="text-primary">Pulse</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        {user && (
          <>
            <NavLink to="/c" className={linkClass}>
              Communities
            </NavLink>
            {user.moderator && (
              <NavLink to="/c/moderator" className={linkClass}>
                <ShieldIcon className="text-base" /> Mod
              </NavLink>
            )}
          </>
        )}

        <ThemeToggle />

        {user && (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2 rounded-full">
              <UserAvatar user={user} className="w-8 h-8" />
              <span className="hidden sm:inline font-medium">{user.username}</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-200 rounded-box z-50 w-56 p-2 shadow-lg mt-2"
            >
              <li className="menu-title">
                <span className="truncate">{user.email}</span>
              </li>
              {user.moderator && (
                <li>
                  <span className="badge badge-secondary badge-sm">Moderator</span>
                </li>
              )}
              <li>
                <Link to="/settings">Settings</Link>
              </li>
              {!user.scheduleUploaded && (
                <li>
                  <Link to="/schedule" className="text-primary">
                    Add class schedule
                  </Link>
                </li>
              )}
              <li>
                <button onClick={onLogout} className="text-error">
                  <LogoutIcon /> Log out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
