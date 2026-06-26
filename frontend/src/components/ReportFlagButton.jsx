import { FlagIcon } from './icons';

/** Small flag button — same affordance as chat message report. */
export default function ReportFlagButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-xs btn-square text-error/80 shrink-0 ${className}`}
      title="Report"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick?.();
      }}
    >
      <FlagIcon />
    </button>
  );
}
