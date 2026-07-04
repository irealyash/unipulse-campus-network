/**
 * Logo — brand identity components for UniPulse.
 *
 * Exports:
 * - BrandText — the styled "UniPulse" text (primary + secondary colours)
 * - BrandLink — a clickable link wrapping BrandText
 *
 * Used in Navbar, AuthShell, Loader, and the landing page.
 */
import { Link } from 'react-router-dom';

/** Renders the styled "UniPulse" brand text. */
export function BrandText({ className = 'text-2xl' }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className="text-primary">Uni</span>
      <span className="text-secondary">Pulse</span>
    </span>
  );
}

/** Wraps BrandText in a React Router <Link>. */
export function BrandLink({
  to = '/',
  className = 'btn btn-ghost text-xl px-2 normal-case',
  textClassName = 'text-xl',
}) {
  return (
    <Link to={to} className={className}>
      <BrandText className={textClassName} />
    </Link>
  );
}

export default BrandText;
