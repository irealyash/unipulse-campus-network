/**
 * EventsTab — thin wrapper that renders EventsFeed in "community" mode
 * for a single community's events channel tab.
 *
 * Passes the current communityId, the community name as subtitle,
 * and enables the "Create event" button.
 *
 * Used as the "Events" channel tab inside CommunityShell.
 */
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EventsFeed from './EventsFeed';

export default function EventsTab() {
  const { communityId } = useParams();
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );

  return (
    <EventsFeed
      mode="community"
      communityId={communityId}
      subtitle={community?.name}
      showCreate
    />
  );
}
