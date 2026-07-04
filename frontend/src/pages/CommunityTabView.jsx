/**
 * CommunityTabView.jsx
 *
 * Tab router for a community's sub-views.
 * Route: "/c/:communityId/:tab" where tab is "chat", "posts", or "events"
 * Role: Reads the :tab param and renders the corresponding tab component.
 * If the tab is invalid, redirects to the "chat" tab as a fallback.
 */

import { Navigate, useParams } from 'react-router-dom';
import ChatTab from '../components/community/ChatTab';
import PostsTab from '../components/community/PostsTab';
import EventsTab from '../components/community/EventsTab';

// Set of valid tab names for URL validation
const VALID = new Set(['chat', 'posts', 'events']);

/** Renders the active community tab (chat / posts / events). */
export default function CommunityTabView() {
  // Extract communityId and tab from URL params
  const { communityId, tab } = useParams();

  // If the tab param isn't one of the valid options, redirect to the chat tab
  if (!VALID.has(tab)) {
    return <Navigate to={`/c/${encodeURIComponent(communityId)}/chat`} replace />;
  }

  // Render the appropriate tab component based on the URL param
  if (tab === 'posts') return <PostsTab />;
  if (tab === 'events') return <EventsTab />;
  return <ChatTab />;
}
