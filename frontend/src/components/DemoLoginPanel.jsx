/**
 * Expandable User / Moderator demo login choices.
 * Shown only after the footer "Demo Login" link is clicked.
 */

const DEMO_ROLES = [
  { label: 'User', email: 'demo_user@unipulse.live', password: 'Password123' },
  { label: 'Moderator', email: 'demo_admin@unipulse.live', password: 'Password123' },
];

export default function DemoLoginPanel({ open, loading, onSelect }) {
  if (!open) return null;

  return (
    <div className="mt-5 pt-4 border-t border-base-300/60 animate-pop-in">
      <p className="text-xs font-medium text-base-content/60 mb-2 uppercase tracking-wide">
        Demo Login
      </p>
      <div className="flex flex-col gap-2">
        {DEMO_ROLES.map((role) => (
          <button
            key={role.label}
            type="button"
            disabled={loading}
            onClick={() => onSelect(role)}
            className="btn btn-ghost btn-sm justify-start h-auto py-2.5 px-3 rounded-xl border border-base-300/70 font-semibold text-sm"
          >
            {role.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { DEMO_ROLES };
