/**
 * AuthShell — shared layout wrapper for authentication pages (login, signup,
 * verify email, forgot password, etc.).
 *
 * Renders a full-screen gradient background with decorative blurred blobs,
 * a theme toggle in the top-right corner, and a centered frosted-glass card
 * containing the brand logo, an optional title/subtitle, the form children,
 * and an optional footer.
 *
 * Props:
 * @param {string}      [title]    — heading inside the card
 * @param {string}      [subtitle] — secondary text below the title
 * @param {ReactNode}   children   — the form content
 * @param {ReactNode}   [footer]   — footer links (e.g. "Already have an account?")
 */
import { Link } from 'react-router-dom';
import { BrandText } from './Logo';
import ThemeToggle from './ThemeToggle';

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
          <Link to="/" className="flex justify-center mb-4">
            <BrandText className="text-3xl" />
          </Link>

          {title ? <h1 className="text-center text-xl font-bold">{title}</h1> : null}
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
