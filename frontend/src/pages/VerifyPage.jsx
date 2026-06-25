import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verify } from '../features/auth/authSlice';
import api from '../lib/api';
import AuthShell from '../components/AuthShell';

/**
 * Signup step 2: enter the 6-digit code emailed to the student. On success the
 * account is created, a token is stored, and we send them to add their schedule.
 */
export default function VerifyPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(verify({ email: email.toLowerCase(), code }));
    if (verify.fulfilled.match(res)) {
      // Brand-new account -> nudge them to upload their schedule next.
      navigate('/schedule');
    }
  };

  const onResend = async () => {
    setResendMsg('');
    try {
      await api.post('/auth/resend', { email: email.toLowerCase() });
      setResendMsg('A new code has been sent.');
    } catch (err) {
      setResendMsg(err.message);
    }
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a 6-digit code to your UBC email"
      footer={
        <Link to="/signup" className="link link-primary">
          ← Back to signup
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="form-control">
          <span className="label-text mb-1 font-medium">UBC email</span>
          <input
            type="email"
            required
            className="input input-bordered w-full rounded-2xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1 font-medium">Verification code</span>
          <input
            inputMode="numeric"
            required
            maxLength={6}
            placeholder="••••••"
            className="input input-bordered w-full rounded-2xl text-center text-2xl tracking-[0.5em] font-bold"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </label>

        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Verify & create account
        </button>

        <div className="text-center text-sm text-base-content/60">
          Didn’t get it?{' '}
          <button type="button" onClick={onResend} className="link link-primary">
            Resend code
          </button>
          {resendMsg && <div className="text-success mt-1">{resendMsg}</div>}
        </div>
      </form>
    </AuthShell>
  );
}
