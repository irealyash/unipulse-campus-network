import { Link } from 'react-router-dom';
import { SparkleIcon } from './icons';
import ThemeToggle from './ThemeToggle';

/**
 * Shared shell for all auth pages: a soft gradient backdrop with floating
 * blobs, the UniPulse brand, and a centered glass card for the form.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-200 flex items-center justify-center p-4">
      {/* Decorative bubbly blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="card w-full max-w-md bg-base-100/80 backdrop-blur-xl shadow-2xl border border-base-content/5 z-10 animate-pop-in">
        <div className="card-body">
          <Link to="/" className="flex items-center gap-2 justify-center mb-2">
            <span className="text-primary text-3xl">
              <SparkleIcon />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Uni<span className="text-primary">Pulse</span>
            </span>
          </Link>

          <h1 className="text-center text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-center text-sm text-base-content/60 mb-2">{subtitle}</p>
          )}

          {children}

          {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
