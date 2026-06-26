import { Navigate, useParams } from 'react-router-dom';
import ChatTab from '../components/community/ChatTab';
import PostsTab from '../components/community/PostsTab';
import EventsTab from '../components/community/EventsTab';

const VALID = new Set(['chat', 'posts', 'events']);

/** Renders the active community tab (chat / posts / events). */
export default function CommunityTabView() {
  const { communityId, tab } = useParams();

  if (!VALID.has(tab)) {
    return <Navigate to={`/c/${encodeURIComponent(communityId)}/chat`} replace />;
  }

  if (tab === 'posts') return <PostsTab />;
  if (tab === 'events') return <EventsTab />;
  return <ChatTab />;
}
