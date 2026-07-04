/**
 * ForgotPasswordPage.jsx
 *
 * Password reset request form.
 * Route: "/forgot-password"
 * Role: Allows the user to request a password-reset code by entering their
 * UBC email. On success, navigates to /reset-password with the email pre-filled.
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../features/auth/authSlice';
import AuthShell from '../components/AuthShell';

/**
 * Request a password-reset code by email.
 */
export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Reads auth.status from Redux — drives the loading state on the submit button
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Local state for the email input
  const [email, setEmail] = useState('');

  /**
   * Handler: form submission.
   * Triggered when the user clicks "Send reset code".
   * Dispatches forgotPassword thunk; on success navigates to /reset-password
   * passing the email so it can be pre-filled on the next page.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(forgotPassword({ email: email.toLowerCase() }));
    if (forgotPassword.fulfilled.match(res)) {
      navigate('/reset-password', { state: { email: email.toLowerCase() } });
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll email you a reset code"
      footer={
        <Link to="/login" className="link link-primary">
          ← Back to login
        </Link>
      }
    >
      {/* Reset request form — email field and submit button */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* UBC email input */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">UBC email</span>
          <input
            type="email"
            required
            placeholder="you@student.ubc.ca"
            className="input input-bordered w-full rounded-2xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {/* Submit button — shows spinner while request is in progress */}
        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Send reset code
        </button>
      </form>
    </AuthShell>
  );
}
