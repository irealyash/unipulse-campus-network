/**
 * SettingsPage.jsx
 *
 * User account settings page.
 * Route: "/settings"
 * Role: Displays the user's profile card (avatar, username, email, moderator
 * badge, enrolled sections) and provides a form to change username (limited
 * to once per 7 days). Also includes a logout button.
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { changeUsername, logout } from '../features/auth/authSlice';
import UserAvatar from '../components/UserAvatar';
import { CalendarIcon, ShieldIcon, LogoutIcon } from '../components/icons';

/**
 * User settings: profile overview + the weekly-limited username change.
 */
export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Reads the current user object from Redux
  const user = useSelector((s) => s.auth.user);
  // Reads auth.status for loading state on the username change form
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Local state for the username input
  const [username, setUsername] = useState(user?.username || '');
  // Feedback message after username change attempt (success or error)
  const [msg, setMsg] = useState(null);
  // Capture "now" once at mount so the cooldown calculation is stable across renders
  const [now] = useState(() => Date.now());

  // Compute the weekly username-change cooldown
  const last = user?.lastUsernameChange ? new Date(user.lastUsernameChange) : null;
  const nextAllowed = last ? new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const canChange = !nextAllowed || now >= nextAllowed.getTime();

  /**
   * Handler: username change form submission.
   * Triggered when the user clicks "Save".
   * Dispatches the changeUsername thunk and shows success/error feedback.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await dispatch(changeUsername(username.trim()));
    if (changeUsername.fulfilled.match(res)) setMsg({ ok: true, text: 'Username updated!' });
    else setMsg({ ok: false, text: res.payload || 'Could not update username.' });
  };

  /**
   * Handler: logout button click.
   * Dispatches the logout action and redirects to /login.
   */
  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">Settings</h1>

      {/* Profile card — avatar, username, email, moderator badge, enrolled sections */}
      <div className="card bg-base-100 shadow-md border border-base-content/5 mb-6">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} className="w-16 rounded-2xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user?.username}</h2>
                {/* Moderator badge — conditionally rendered */}
                {user?.moderator && (
                  <span className="badge badge-secondary gap-1">
                    <ShieldIcon /> Moderator
                  </span>
                )}
              </div>
              <p className="text-sm text-base-content/60">{user?.email}</p>
            </div>
          </div>

          <div className="divider my-2" />

          {/* Enrolled course sections list or link to add schedule */}
          <div className="flex flex-wrap gap-2 items-center">
            <CalendarIcon className="text-secondary" />
            <span className="text-sm font-medium">Enrolled sections:</span>
            {user?.enrolledSections?.length ? (
              user.enrolledSections.map((s) => (
                <span key={s} className="badge badge-outline badge-sm">
                  {s}
                </span>
              ))
            ) : (
              <Link to="/schedule" className="link link-primary text-sm">
                Add your schedule
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Change username card — form with weekly cooldown enforcement */}
      <div className="card bg-base-100 shadow-md border border-base-content/5">
        <div className="card-body">
          <h2 className="card-title">Change username</h2>
          <p className="text-sm text-base-content/60">
            You can change your username once every 7 days.
          </p>

          {/* Success or error message after save attempt */}
          {msg && (
            <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'} py-2 text-sm`}>
              <span>{msg.text}</span>
            </div>
          )}

          {/* Cooldown warning — shown when the user can't change yet */}
          {!canChange && (
            <div className="alert alert-warning py-2 text-sm">
              <span>
                You can change it again on {nextAllowed.toLocaleDateString()}.
              </span>
            </div>
          )}

          {/* Username change form */}
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input
              type="text"
              minLength={3}
              maxLength={20}
              className="input input-bordered rounded-2xl flex-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!canChange}
            />
            <button
              type="submit"
              className="btn btn-primary rounded-2xl"
              disabled={loading || !canChange || username.trim() === user?.username}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              Save
            </button>
          </form>
        </div>
      </div>

      {/* Logout card */}
      <div className="card bg-base-100 shadow-md border border-base-content/5 mt-6">
        <div className="card-body p-2">
          <ul className="menu rounded-box w-full">
            <li>
              <button type="button" onClick={onLogout} className="text-error">
                <LogoutIcon /> Log out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
