/**
 * Centered loading spinner used for route-level / full-page loading states.
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
