/**
 * CommunityHub.jsx
 *
 * Main community shell page (Discord-style layout).
 * Route: "/c", "/c/:communityId", "/c/:communityId/:tab"
 * Role: Acts as the top-level layout for the authenticated community
 * experience. Fetches the community list, checks onboarding status,
 * validates that the user has access to the selected community, and
 * renders the CommunityShell (sidebar + content area). Also exports
 * CommunityRedirect for the bare /c path.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { fetchCommunities, fetchCommunity } from '../features/communities/communitiesSlice';
import CommunityShell from '../components/layout/CommunityShell';
import Loader from '../components/Loader';
import { communityChatPath, pickDefaultCommunityId } from '../lib/communityNav';
import { filterNavbarCommunities } from '../lib/navbarCommunities';
import CommunityHomeEmpty from './CommunityHomeEmpty';

/**
 * CommunityRedirect — renders at the bare "/c" path.
 * Reads the community list from Redux, picks the first available community,
 * and redirects to its chat tab. If no communities exist, shows the empty home.
 */
export function CommunityRedirect() {
  // Reads the full community list from Redux and filters to navbar-visible ones
  const rawList = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const list = filterNavbarCommunities(rawList, user);
  const status = useSelector((s) => s.communities.status);

  // Show loader while the community list is being fetched
  if (status === 'loading') {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  // Redirect to the first available community's chat, or show empty state
  const target = pickDefaultCommunityId(list, user);
  if (target) {
    return <Navigate to={communityChatPath(target)} replace />;
  }

  return <CommunityHomeEmpty />;
}

/** Loads communities then renders the Discord-style shell. */
export default function CommunityHub() {
  const dispatch = useDispatch();
  const { communityId } = useParams();

  // Reads the community list from Redux and filters for the navbar
  const rawList = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const list = filterNavbarCommunities(rawList, user);
  const status = useSelector((s) => s.communities.status);

  /**
   * useEffect: Fetches the full list of communities the user belongs to.
   * Runs once on mount.
   */
  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  /**
   * useEffect: Fetches details for the currently selected community.
   * Runs whenever communityId changes (but not for special virtual routes
   * like "moderator").
   */
  useEffect(() => {
    if (communityId && communityId !== 'moderator') {
      dispatch(fetchCommunity(communityId));
    }
  }, [dispatch, communityId]);

  // Redirect to onboarding if user hasn't completed it yet
  if (user && user.communityOnboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // Full-screen loader while the initial community list is being fetched
  if (status === 'loading' && !list.length) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  // Access control: if communityId is set but user isn't in the list and isn't
  // enrolled, redirect to a valid community or the bare /c route
  const inList = list.some((c) => c._id === communityId);
  const enrolled = user?.enrolledSections?.includes(communityId);
  if (
    communityId &&
    communityId !== 'moderator' &&
    communityId !== 'events' &&
    communityId !== 'messages' &&
    !inList &&
    !enrolled &&
    !user?.moderator
  ) {
    const fallback = pickDefaultCommunityId(list, user);
    if (fallback) {
      return <Navigate to={communityChatPath(fallback)} replace />;
    }
    return <Navigate to="/c" replace />;
  }

  // Render the main Discord-style community shell (sidebar + content outlet)
  return <CommunityShell />;
}
