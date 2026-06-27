import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearCurrentCommunity } from '../features/communities/communitiesSlice';
import EventsFeed from '../components/community/EventsFeed';

/** All upcoming events from public communities (no channel sidebar). */
export default function AllEventsPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCurrentCommunity());
  }, [dispatch]);

  return (
    <EventsFeed
      mode="all"
      subtitle="Does not include events from private communities."
      showCommunityName
    />
  );
}
