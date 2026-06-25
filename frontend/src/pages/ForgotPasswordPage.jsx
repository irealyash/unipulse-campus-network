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
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';
  const [email, setEmail] = useState('');

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
      subtitle="We’ll email you a reset code"
      footer={
        <Link to="/login" className="link link-primary">
          ← Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Send reset code
        </button>
      </form>
    </AuthShell>
  );
}
