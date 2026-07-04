/**
 * EVENT TAGS
 * ----------------------------------------------------------------------------
 * Constants and UI component for event tag badges. Tags categorize events
 * (e.g. "Official", "Student-Led") and are assigned by moderators during
 * the event approval process. Also defines the filter options for the
 * public events feed.
 */

/** Tags shown as filter options in the public events feed. */
export const EVENT_FEED_TAG_FILTERS = ['Official', 'Student-Led'];

/** Full set of tags that moderators can assign when approving an event. */
export const EVENT_TAGS = ['Official', 'Student-Led', 'Limited', 'Trending'];

/**
 * Small badge component that displays an event tag.
 * Renders nothing if no tag is provided.
 * @param {{ tag: string, className?: string }} props
 * @returns {JSX.Element|null} A DaisyUI outline badge, or null.
 */
export function EventTagBadge({ tag, className = '' }) {
  if (!tag) return null;
  return (
    <span className={`badge badge-outline badge-xs shrink-0 ${className}`.trim()}>
      {tag}
    </span>
  );
}
