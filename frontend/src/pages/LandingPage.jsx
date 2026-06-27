import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { SparkleIcon, ChatIcon, ShieldIcon, UsersIcon } from '../components/icons';

const signupState = { showWelcome: true };

/**
 * Public marketing/landing page. Anonymous, UBC-only social app — sells the
 * vibe and points users to signup / login.
 */
export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-200">
      {/* Floating gradient blobs for a bubbly feel */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-24 w-[26rem] h-[26rem] rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />

      {/* Top bar */}
      <header className="navbar max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <div className="flex-1">
          <span className="btn btn-ghost text-xl gap-2 normal-case">
            <span className="text-primary text-2xl">
              <SparkleIcon />
            </span>
            <span className="font-extrabold tracking-tight">
              Uni<span className="text-primary">Pulse</span>
            </span>
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

      {/* Hero */}
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

      {/* Feature cards */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20 grid gap-5 sm:grid-cols-3">
        {[
          {
            icon: <UsersIcon />,
            title: 'Course communities',
            body: 'Upload your schedule and we auto-unlock private rooms for every class section you’re in.',
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

      <footer className="relative z-10 text-center pb-8 text-sm text-base-content/50">
        Built for University students · Anonymous by design
      </footer>
    </div>
  );
}
