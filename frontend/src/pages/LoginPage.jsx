/**
 * LoginPage.jsx
 *
 * Authenticated login form for existing users.
 * Route: "/login"
 * Role: Accepts email-or-username + password, dispatches the login thunk,
 * and redirects to the community hub (/c) on success.
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../features/auth/authSlice';
import { fetchCommunities } from '../features/communities/communitiesSlice';
import AuthShell from '../components/AuthShell';

/**
 * Login with email OR username + password.
 */
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Reads auth.status from Redux to show a loading spinner during the request
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Local form state — identifier can be an email or username
  const [form, setForm] = useState({ identifier: '', password: '' });

  // Generic field updater: returns an onChange handler for a given key
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  /**
   * Handler: form submission.
   * Triggered when the user clicks "Log in".
   * Dispatches the login async thunk; on success navigates to /c.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (login.fulfilled.match(res)) {
      dispatch(fetchCommunities());
      navigate('/c');
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your UniPulse account"
      footer={
        <span className="text-base-content/70">
          New here?{' '}
          <Link to="/signup" className="link link-primary font-medium">
            Create an account
          </Link>
        </span>
      }
    >
      {/* Login form — identifier + password fields and submit button */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Email or username input */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">Email or username</span>
          <input
            type="text"
            required
            placeholder="you@student.ubc.ca or username"
            className="input input-bordered w-full rounded-2xl"
            value={form.identifier}
            onChange={update('identifier')}
          />
        </label>

        {/* Password input with "Forgot?" link */}
        <label className="form-control">
          <div className="flex items-center justify-between mb-1">
            <span className="label-text font-medium">Password</span>
            <Link to="/forgot-password" className="link link-primary text-xs">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            placeholder="Your password"
            className="input input-bordered w-full rounded-2xl"
            value={form.password}
            onChange={update('password')}
          />
        </label>

        {/* Submit button — disabled and shows spinner while loading */}
        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Log in
        </button>
      </form>
    </AuthShell>
  );
}
