/**
 * LandingPage.jsx
 *
 * Public marketing/landing page for UniPulse.
 * Route: "/" (unauthenticated visitors only)
 * Role: First page anonymous visitors see — promotes the app's value props
 * (anonymous student communities, course chat, moderation) and funnels
 * users toward signup or login.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';
import { BrandText } from '../components/Logo';
import { SparkleIcon, ChatIcon, ShieldIcon, UsersIcon } from '../components/icons';

// Navigation state passed to SignupPage so it can show a welcome modal on arrival
const signupState = { showWelcome: true };

/**
 * Public marketing/landing page. Anonymous, UBC-only social app — sells the
 * vibe and points users to signup / login.
 */
export default function LandingPage() {
  // State: controls visibility of the Terms and Privacy modals
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Tailwind classes shared by the footer legal links
  const legalLinkClass =
    'text-[10px] leading-tight text-base-content/35 hover:text-base-content/50 font-normal transition-colors';

  return (
    <div className="relative min-h-screen overflow-hidden bg-base-200 flex flex-col">
      {/* Decorative gradient blobs — purely visual, non-interactive background elements */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-24 w-[26rem] h-[26rem] rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />

      {/* Top navigation bar — brand logo, theme toggle, login/signup CTAs */}
      <header className="navbar max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <div className="flex-1">
          <span className="px-2">
            <BrandText className="text-[1.5625rem]" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="btn btn-ghost btn-sm rounded-full">
            Log in
          </Link>
          <Link to="/signup" state={signupState} className="btn btn-primary btn-sm rounded-full">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero section — headline, subtitle, and primary CTAs */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 text-center pt-16 pb-12">
        <div className="badge badge-secondary badge-lg gap-1 mb-6">
          <SparkleIcon /> For University students only
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Your campus, <span className="text-primary">anonymously</span> connected.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-base-content/70 max-w-2xl mx-auto">
          Verify with your <span className="font-semibold">student</span> email, drop in
          your class schedule, and instantly join anonymous communities for every course you take,
          plus campus-wide rooms for everything else.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" state={signupState} className="btn btn-primary btn-lg rounded-full shadow-lg">
            Join UniPulse
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg rounded-full">
            I already have an account
          </Link>
        </div>
      </section>

      {/* Feature cards — three value-prop cards rendered from an array */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-8 grid gap-5 sm:grid-cols-3">
        {[
          {
            icon: <UsersIcon />,
            title: 'Course communities',
            body: "Upload your schedule and we auto-unlock private rooms for every class section you're in.",
          },
          {
            icon: <ChatIcon />,
            title: 'Anonymous group chat',
            body: 'Chat live with classmates behind a friendly alias. React with emojis, reply in threads.',
          },
          {
            icon: <ShieldIcon />,
            title: 'Safe & moderated',
            body: 'Report anything in a tap. Moderators keep every community welcoming and on-topic.',
          },
        ].map((f) => (
          <div
            key={f.title}
            className="card bg-base-100/70 backdrop-blur border border-base-content/5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition"
          >
            <div className="card-body items-center text-center">
              <div className="text-3xl text-primary bg-primary/10 rounded-2xl p-3">{f.icon}</div>
              <h3 className="card-title text-lg">{f.title}</h3>
              <p className="text-sm text-base-content/70">{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Footer — tagline and legal links that open Terms/Privacy modals */}
      <div className="relative z-10 mt-auto">
        <footer className="text-center pt-10 text-sm text-base-content/50">
          <p>Built for University students · Anonymous by design</p>
          <br mt-1></br>
        </footer>
        <div className="text-center pb-[3px] flex items-center justify-center gap-8">
          {/* Opens the Terms and Conditions modal */}
          <button type="button" className={legalLinkClass} onClick={() => setTermsOpen(true)}>
            Terms and Conditions
          </button>
          {/* Opens the Privacy Policy modal */}
          <button type="button" className={legalLinkClass} onClick={() => setPrivacyOpen(true)}>
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Legal modals — rendered at the bottom, visibility controlled by state */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
