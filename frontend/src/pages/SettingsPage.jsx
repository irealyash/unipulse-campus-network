import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { changeUsername } from '../features/auth/authSlice';
import UserAvatar from '../components/UserAvatar';
import { CalendarIcon, ShieldIcon } from '../components/icons';

/**
 * User settings: profile overview + the weekly-limited username change.
 */
export default function SettingsPage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  const [username, setUsername] = useState(user?.username || '');
  const [msg, setMsg] = useState(null);
  // Capture "now" once at mount (keeps render pure for the lint rule).
  const [now] = useState(() => Date.now());

  // Compute whether the weekly cooldown has elapsed.
  const last = user?.lastUsernameChange ? new Date(user.lastUsernameChange) : null;
  const nextAllowed = last ? new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const canChange = !nextAllowed || now >= nextAllowed.getTime();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const res = await dispatch(changeUsername(username.trim()));
    if (changeUsername.fulfilled.match(res)) setMsg({ ok: true, text: 'Username updated!' });
    else setMsg({ ok: false, text: res.payload || 'Could not update username.' });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-6">Settings</h1>

      {/* Profile card */}
      <div className="card bg-base-100 shadow-md border border-base-content/5 mb-6">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} className="w-16 rounded-2xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{user?.username}</h2>
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

      {/* Change username */}
      <div className="card bg-base-100 shadow-md border border-base-content/5">
        <div className="card-body">
          <h2 className="card-title">Change username</h2>
          <p className="text-sm text-base-content/60">
            You can change your anonymous alias once every 7 days.
          </p>

          {msg && (
            <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'} py-2 text-sm`}>
              <span>{msg.text}</span>
            </div>
          )}

          {!canChange && (
            <div className="alert alert-warning py-2 text-sm">
              <span>
                You can change it again on {nextAllowed.toLocaleDateString()}.
              </span>
            </div>
          )}

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
    </div>
  );
}
