import EventsFeed from '../components/community/EventsFeed';

export default function AllEventsFeedPage() {
  return (
    <EventsFeed
      mode="all"
      subtitle="Does not include events from private communities."
      showCommunityName
    />
  );
}
