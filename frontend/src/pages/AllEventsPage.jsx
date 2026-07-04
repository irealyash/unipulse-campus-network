/**
 * AllEventsPage.jsx
 *
 * Layout wrapper for the cross-community events feed.
 * Route: "/c/events" (parent route — child routes render the feed or detail)
 * Role: Clears the currently-selected community in Redux (since this is a
 * global view, not tied to a single community) and renders child routes
 * via <Outlet />.
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { clearCurrentCommunity } from '../features/communities/communitiesSlice';

/** All-events layout — clears selected community; child routes render feed or detail. */
export default function AllEventsPage() {
  const dispatch = useDispatch();

  /**
   * useEffect: Clears the currently-selected community from Redux state.
   * Runs once on mount so that the community shell UI doesn't highlight any
   * single community while viewing the global events feed.
   */
  useEffect(() => {
    dispatch(clearCurrentCommunity());
  }, [dispatch]);

  // Renders nested routes (AllEventsFeedPage or EventPage)
  return <Outlet />;
}
