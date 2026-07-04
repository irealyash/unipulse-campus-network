/**
 * Loader — centered loading spinner with an optional label and brand logo.
 *
 * Used as a route-level / full-page loading indicator and inside components
 * while data is being fetched (posts, events, messages, etc.).
 *
 * Props:
 * @param {string}  label    — text shown below the spinner (default: "Loading…")
 * @param {boolean} showLogo — if true, renders the UniPulse brand above the spinner
 */
import { BrandText } from './Logo';

export default function Loader({ label = 'Loading…', showLogo = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-base-content/60">
      {showLogo && <BrandText className="text-3xl" />}
      <span className="loading loading-spinner loading-lg text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
