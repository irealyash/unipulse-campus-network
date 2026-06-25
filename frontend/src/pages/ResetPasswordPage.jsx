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
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    newPassword: '',
    confirm: '',
  });
  const [localError, setLocalError] = useState('');
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {localError && (
          <div className="alert alert-error py-2 text-sm">
            <span>{localError}</span>
          </div>
        )}

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

        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Reset password
        </button>
      </form>
    </AuthShell>
  );
}
