import { ShieldIcon, UsersIcon, FlagIcon, SparkleIcon } from './icons';

const STANDARDS = [
  {
    icon: UsersIcon,
    title: 'Be Respectful',
    body: 'Our platform is a space for open dialogue, but harassment, personal attacks, and disrespectful behavior are strictly prohibited.',
  },
  {
    icon: FlagIcon,
    title: 'Zero Tolerance for Hate',
    body: 'We have a zero-tolerance policy for racism, hate speech, or discriminatory content of any kind.',
  },
  {
    icon: ShieldIcon,
    title: 'Protect Your Privacy',
    body: 'For your safety, do not share sensitive personal details (phone numbers, addresses, etc.) in public chats.',
  },
  {
    icon: SparkleIcon,
    title: 'Academic Integrity',
    body: 'The use of this platform to facilitate, encourage, or participate in academic misconduct is strictly forbidden.',
  },
];

/**
 * Shown on signup when arriving from the landing page. User must agree before
 * creating an account.
 */
export default function CommunityWelcomeModal({ open, onAgree }) {
  if (!open) return null;

  return (
    <div className="modal modal-open z-[100]">
      <div className="modal-box max-w-lg rounded-3xl border border-base-content/10 bg-base-100 shadow-2xl p-0 overflow-hidden">
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 text-primary mb-3">
            <ShieldIcon className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-base-content">Welcome to the Community</h2>
        </div>

        <div className="px-6 py-5 max-h-[min(60vh,28rem)] overflow-y-auto">
          <p className="text-sm text-base-content/80 leading-relaxed">
            By creating an account, you agree to abide by our community standards. Failure to
            adhere to these rules will result in a{' '}
            <span className="font-semibold text-error">permanent ban</span>.
          </p>

          <ul className="mt-5 space-y-3">
            {STANDARDS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-3 rounded-2xl border border-base-content/10 bg-base-200/50 p-3"
              >
                <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <Icon className="text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-base-content">{title}</p>
                  <p className="text-xs text-base-content/70 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-4 border-t border-base-content/10 bg-base-200/30">
          <button
            type="button"
            className="btn btn-primary w-full rounded-2xl"
            onClick={onAgree}
          >
            I agree
          </button>
        </div>
      </div>
    </div>
  );
}
