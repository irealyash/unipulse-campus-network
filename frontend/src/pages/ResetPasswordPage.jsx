/**
 * ResetPasswordPage.jsx
 *
 * Complete a password reset using the emailed code.
 * Route: "/reset-password"
 * Role: The user enters their email, the 6-digit reset code, and a new
 * password (with confirmation). On success, navigates back to /login.
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../features/auth/authSlice';
import AuthShell from '../components/AuthShell';

/**
 * Complete a password reset using the emailed code + a new password.
 */
export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Reads auth.status from Redux — drives loading state
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Form state — email is pre-filled from navigation state if coming from ForgotPasswordPage
  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    newPassword: '',
    confirm: '',
  });
  // Client-side validation error
  const [localError, setLocalError] = useState('');
  // Generic field updater
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  /**
   * Handler: form submission.
   * Triggered when the user clicks "Reset password".
   * Validates password length and match, then dispatches the resetPassword thunk.
   * On success, navigates to /login.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.newPassword.length < 8) return setLocalError('Password must be at least 8 characters.');
    if (form.newPassword !== form.confirm) return setLocalError('Passwords do not match.');

    const res = await dispatch(
      resetPassword({
        email: form.email.toLowerCase(),
        code: form.code,
        newPassword: form.newPassword,
      })
    );
    if (resetPassword.fulfilled.match(res)) navigate('/login');
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code we emailed and choose a new password"
      footer={
        <Link to="/login" className="link link-primary">
          ← Back to login
        </Link>
      }
    >
      {/* Reset form — email, code, new password, confirm */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Client-side validation error banner */}
        {localError && (
          <div className="alert alert-error py-2 text-sm">
            <span>{localError}</span>
          </div>
        )}

        {/* Email input — pre-filled from forgot-password flow */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">UBC email</span>
          <input
            type="email"
            required
            className="input input-bordered w-full rounded-2xl"
            value={form.email}
            onChange={update('email')}
          />
        </label>

        {/* 6-digit reset code — numeric only */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">Reset code</span>
          <input
            inputMode="numeric"
            required
            maxLength={6}
            placeholder="••••••"
            className="input input-bordered w-full rounded-2xl text-center text-xl tracking-[0.4em] font-bold"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
          />
        </label>

        {/* New password input */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">New password</span>
          <input
            type="password"
            required
            className="input input-bordered w-full rounded-2xl"
            value={form.newPassword}
            onChange={update('newPassword')}
          />
        </label>

        {/* Confirm new password input */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">Confirm new password</span>
          <input
            type="password"
            required
            className="input input-bordered w-full rounded-2xl"
            value={form.confirm}
            onChange={update('confirm')}
          />
        </label>

        {/* Submit button */}
        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Reset password
        </button>
      </form>
    </AuthShell>
  );
}
