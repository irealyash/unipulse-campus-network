/**
 * VerifyPage.jsx
 *
 * Email verification form (step 2 of signup).
 * Route: "/verify"
 * Role: The user enters the 6-digit code emailed to their UBC address.
 * On successful verification the account is fully created, a JWT is stored,
 * and the user is sent to the onboarding page to pick communities/schedule.
 */

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

  // Reads auth.status from Redux — shows a spinner while the verify request is in flight
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Pre-fill email from navigation state passed by SignupPage
  const [email, setEmail] = useState(location.state?.email || '');
  // 6-digit verification code entered by the user
  const [code, setCode] = useState('');
  // Feedback message for the "resend code" action
  const [resendMsg, setResendMsg] = useState('');

  /**
   * Handler: form submission.
   * Triggered when the user clicks "Verify & create account".
   * Dispatches the verify thunk with email + code; navigates to /onboarding on success.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(verify({ email: email.toLowerCase(), code }));
    if (verify.fulfilled.match(res)) {
      // Brand-new account -> nudge them to upload their schedule next.
      navigate('/onboarding');
    }
  };

  /**
   * Handler: resend verification code.
   * Triggered when the user clicks "Resend code".
   * Calls the /auth/resend endpoint directly and shows a success/error message.
   */
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
      {/* Verification form — email field (prefilled) and code input */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Email input — pre-filled from signup but editable */}
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

        {/* 6-digit code input — numeric only, strips non-digits */}
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

        {/* Submit button — shows spinner while verifying */}
        <button type="submit" className="btn btn-primary rounded-2xl mt-2" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          Verify & create account
        </button>

        {/* Resend code link and status message */}
        <div className="text-center text-sm text-base-content/60">
          Didn't get it?{' '}
          <button type="button" onClick={onResend} className="link link-primary">
            Resend code
          </button>
          {resendMsg && <div className="text-success mt-1">{resendMsg}</div>}
        </div>
      </form>
    </AuthShell>
  );
}
