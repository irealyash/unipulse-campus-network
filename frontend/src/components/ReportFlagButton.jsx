/**
 * ReportFlagButton — small inline flag icon button used next to posts,
 * comments, events, and messages to trigger the ReportModal.
 *
 * Stops event propagation so clicking the flag doesn't also navigate
 * to the content's detail page.
 *
 * Props:
 * @param {() => void} onClick   — called when the button is clicked
 * @param {string}     className — additional Tailwind classes
 */
import { FlagIcon } from './icons';

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
