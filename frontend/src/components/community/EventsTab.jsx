import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import EventsFeed from './EventsFeed';

/** Events tab for a single community. */
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
