import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signup } from '../features/auth/authSlice';
import AuthShell from '../components/AuthShell';
import CommunityWelcomeModal from '../components/CommunityWelcomeModal';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

const AGREED_KEY = 'unipulse_community_agreed';

/**
 * Signup step 1: collect UBC email, alias and password. On success the backend
 * emails a code and we route to the verify page.
 */
export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  const [welcomeOpen, setWelcomeOpen] = useState(
    () => Boolean(location.state?.showWelcome) && !sessionStorage.getItem(AGREED_KEY)
  );

  useEffect(() => {
    if (location.state?.showWelcome) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state?.showWelcome, navigate]);

  const handleAgree = () => {
    sessionStorage.setItem(AGREED_KEY, '1');
    setWelcomeOpen(false);
  };

  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.email.toLowerCase().endsWith('@student.ubc.ca')) {
      return setLocalError('Email must end in @student.ubc.ca');
    }
    if (form.password.length < 8) {
      return setLocalError('Password must be at least 8 characters.');
    }
    if (form.password !== form.confirm) {
      return setLocalError('Passwords do not match.');
    }
    if (!acceptedLegal) {
      return setLocalError('You must accept the Terms and Conditions and Privacy Policy.');
    }

    const res = await dispatch(
      signup({ email: form.email, username: form.username, password: form.password })
    );
    if (signup.fulfilled.match(res)) {
      // Carry the email forward so the verify page can prefill it.
      navigate('/verify', { state: { email: form.email.toLowerCase() } });
    }
  };

  return (
    <>
      <CommunityWelcomeModal open={welcomeOpen} onAgree={handleAgree} />
      <AuthShell
      title="Create your account"
      subtitle="Anonymous to classmates · verified as a UBC student"
      footer={
        <span className="text-base-content/70">
          Already have an account?{' '}
          <Link to="/login" className="link link-primary font-medium">
            Log in
          </Link>
        </span>
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
            placeholder="you@student.ubc.ca"
            className="input input-bordered w-full rounded-2xl"
            value={form.email}
            onChange={update('email')}
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1 font-medium">Anonymous username</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={20}
            placeholder="e.g. night_owl"
            className="input input-bordered w-full rounded-2xl"
            value={form.username}
            onChange={update('username')}
          />
          <span className="label-text-alt text-base-content/50 mt-1">
            3–20 chars · letters, numbers, underscores
          </span>
        </label>

        <label className="form-control">
          <span className="label-text mb-1 font-medium">Password</span>
          <input
            type="password"
            required
            placeholder="At least 8 characters"
            className="input input-bordered w-full rounded-2xl"
            value={form.password}
            onChange={update('password')}
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1 font-medium">Confirm password</span>
          <input
            type="password"
            required
            placeholder="Re-enter your password"
            className="input input-bordered w-full rounded-2xl"
            value={form.confirm}
            onChange={update('confirm')}
          />
        </label>

        <div className="flex items-start gap-2.5 text-sm text-base-content/80 mt-1">
          <input
            id="legal-accept"
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
          />
          <label htmlFor="legal-accept" className="leading-snug cursor-pointer">
            I accept the{' '}
            <button
              type="button"
              className="link link-primary align-baseline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTermsOpen(true);
              }}
            >
              Terms and Conditions
            </button>{' '}
            and{' '}
            <button
              type="button"
              className="link link-primary align-baseline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPrivacyOpen(true);
              }}
            >
              Privacy Policy
            </button>
            .
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary rounded-2xl mt-2"
          disabled={loading || !acceptedLegal}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          Send verification code
        </button>
      </form>
    </AuthShell>
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
