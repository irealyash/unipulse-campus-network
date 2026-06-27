/** Tags moderators assign when approving an event. */
export const EVENT_TAGS = ['Official', 'Student-Led', 'Limited', 'Trending'];

export function EventTagBadge({ tag, className = '' }) {
  if (!tag) return null;
  return (
    <span className={`badge badge-outline badge-xs shrink-0 ${className}`.trim()}>
      {tag}
    </span>
  );
}
