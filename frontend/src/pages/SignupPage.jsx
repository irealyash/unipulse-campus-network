/**
 * SignupPage.jsx
 *
 * Account creation form (step 1 of signup).
 * Route: "/signup"
 * Role: Collects UBC email, anonymous username, and password. On success the
 * backend emails a 6-digit verification code and the user is redirected to
 * /verify. May also show a community-welcome modal on first arrival from
 * the landing page.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, signup } from '../features/auth/authSlice';
import { fetchCommunities } from '../features/communities/communitiesSlice';
import AuthShell from '../components/AuthShell';
import DemoLoginPanel from '../components/DemoLoginPanel';
import CommunityWelcomeModal from '../components/CommunityWelcomeModal';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

// SessionStorage key to track whether the user has already agreed to the welcome modal
const AGREED_KEY = 'unipulse_community_agreed';

/**
 * Signup step 1: collect UBC email, alias and password. On success the backend
 * emails a code and we route to the verify page.
 */
export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Reads auth.status from Redux — drives the loading spinner on the submit button
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  // Show the community welcome modal if arriving from the landing page (showWelcome flag)
  // and the user hasn't already agreed during this session.
  const [welcomeOpen, setWelcomeOpen] = useState(
    () => Boolean(location.state?.showWelcome) && !sessionStorage.getItem(AGREED_KEY)
  );

  /**
   * useEffect: Clears the navigation state (showWelcome) from the URL so that
   * refreshing the page won't re-trigger the modal. Runs once on mount if the
   * state flag is present.
   */
  useEffect(() => {
    if (location.state?.showWelcome) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state?.showWelcome, navigate]);

  /**
   * Handler: user agrees to community guidelines in the welcome modal.
   * Persists agreement in sessionStorage and closes the modal.
   */
  const handleAgree = () => {
    sessionStorage.setItem(AGREED_KEY, '1');
    setWelcomeOpen(false);
  };

  // Local form state for all signup fields
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' });
  // Client-side validation error message (not from the server)
  const [localError, setLocalError] = useState('');
  // Whether the user has accepted Terms & Privacy
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  // Visibility state for Terms and Privacy modals
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Expands the card to show User / Moderator demo login choices
  const [demoOpen, setDemoOpen] = useState(false);

  // Generic field updater
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  /**
   * Handler: form submission.
   * Triggered when the user clicks "Send verification code".
   * Performs client-side validation (email domain, password length/match, legal acceptance)
   * then dispatches the signup thunk. On success, navigates to /verify with the email.
   */
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

  /** Sign in as a seeded demo role (same accounts as the login page). */
  const loginAsDemo = async (role) => {
    const res = await dispatch(
      login({ identifier: role.email, password: role.password })
    );
    if (login.fulfilled.match(res)) {
      dispatch(fetchCommunities());
      navigate('/c');
    }
  };

  return (
    <>
      {/* Welcome modal — shown only on first arrival from landing page */}
      <CommunityWelcomeModal open={welcomeOpen} onAgree={handleAgree} />
      <AuthShell
      title="Create your account"
      subtitle="Anonymous to classmates · verified as a UBC student"
      footer={
        <span className="text-base-content/70">
          Already have an account?{' '}
          <Link to="/login" className="link link-primary font-medium">
            Log in
          </Link>{' '}
          <button
            type="button"
            className="link link-primary font-medium"
            onClick={() => setDemoOpen((open) => !open)}
          >
            Demo Login
          </button>
        </span>
      }
    >
      {/* Signup form — email, username, password, confirm, legal checkbox */}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Client-side validation error banner */}
        {localError && (
          <div className="alert alert-error py-2 text-sm">
            <span>{localError}</span>
          </div>
        )}

        {/* UBC email input — must end with @student.ubc.ca */}
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

        {/* Anonymous username — 3-20 chars */}
        <label className="form-control">
          <span className="label-text mb-1 font-medium">Anonymous username</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={20}
            placeholder="username"
            className="input input-bordered w-full rounded-2xl"
            value={form.username}
            onChange={update('username')}
          />
          <span className="label-text-alt text-base-content/50 mt-1">
            3–20 chars · letters, numbers, underscores
          </span>
        </label>

        {/* Password input — minimum 8 characters */}
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

        {/* Confirm password input */}
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

        {/* Legal acceptance checkbox with inline buttons to open Terms/Privacy modals */}
        <div className="flex items-center gap-2.5 text-sm text-base-content/80 mt-1">
          <input
            id="legal-accept"
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary shrink-0"
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

        {/* Submit button — disabled while loading or if legal not accepted */}
        <button
          type="submit"
          className="btn btn-primary rounded-2xl mt-2"
          disabled={loading || !acceptedLegal}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          Send verification code
        </button>
      </form>

      <DemoLoginPanel open={demoOpen} loading={loading} onSelect={loginAsDemo} />
    </AuthShell>
      {/* Legal modals — controlled by termsOpen/privacyOpen state */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
