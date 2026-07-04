/**
 * eventTags.js
 *
 * Defines the allowed set of tags that moderators can assign to events
 * during the approval workflow. These tags are displayed in the UI to
 * help students identify the nature and source of each event.
 *
 *   - Official:    Sanctioned by the university or a recognized body
 *   - Student-Led: Organized by students or student clubs
 *   - Limited:     Has capacity constraints or registration limits
 *   - Trending:    Currently popular or highly anticipated
 */

/** Allowed event tags that moderators can assign when approving an event. */
export const EVENT_TAGS = ['Official', 'Student-Led', 'Limited', 'Trending'];
