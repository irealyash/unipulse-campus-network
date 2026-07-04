/**
 * AllEventsFeedPage.jsx
 *
 * Cross-community events feed page.
 * Route: "/c/events" (index child of AllEventsPage)
 * Role: Renders the EventsFeed component in "all" mode, which displays
 * upcoming events from all public communities. Shows the community name
 * on each card since events span multiple communities. A subtitle note
 * clarifies that private-community events are excluded.
 */

import EventsFeed from '../components/community/EventsFeed';

export default function AllEventsFeedPage() {
  return (
    // EventsFeed in "all" mode — fetches events across all public communities
    <EventsFeed
      mode="all"
      subtitle="Does not include events from private communities."
      showCommunityName
    />
  );
}
