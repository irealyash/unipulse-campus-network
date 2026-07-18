/**
 * CommunityHub.jsx — main community shell (Discord-style layout).
 *
 * Empty communities are a valid state: after a successful fetch with [],
 * show the empty home — never keep spinning or re-fetching forever.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { fetchCommunities, fetchCommunity } from '../features/communities/communitiesSlice';
import CommunityShell from '../components/layout/CommunityShell';
import Loader from '../components/Loader';
import { communityChatPath, pickDefaultCommunityId } from '../lib/communityNav';
import CommunityHomeEmpty from './CommunityHomeEmpty';

function CommunitiesLoadError({ message, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <p className="text-error text-sm max-w-md">{message || 'Could not load communities.'}</p>
      <p className="text-xs text-base-content/60 max-w-md">
        Make sure the backend is running on port 5000, then try again.
      </p>
      <button type="button" className="btn btn-primary rounded-2xl" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/** Bare "/c" — redirect to default community, or empty home if the user has none. */
export function CommunityRedirect() {
  const list = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const { status, error } = useSelector((s) => s.communities);
  const dispatch = useDispatch();

  // Still fetching (or about to) — only while we have no data yet.
  if ((status === 'idle' || status === 'loading') && list.length === 0) {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  if (status === 'failed' && list.length === 0) {
    return (
      <CommunitiesLoadError message={error} onRetry={() => dispatch(fetchCommunities())} />
    );
  }

  // Successful load with zero communities is valid — show empty state.
  if (list.length === 0) {
    return <CommunityHomeEmpty />;
  }

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

  const list = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const { status, error } = useSelector((s) => s.communities);

  // Fetch only when we have never loaded yet (idle).
  // Do NOT re-fetch when status is "succeeded" with an empty list — that is valid.
  useEffect(() => {
    if (!user) return;
    if (status === 'idle') {
      dispatch(fetchCommunities());
    }
  }, [dispatch, user, status]);

  useEffect(() => {
    if (
      communityId &&
      communityId !== 'moderator' &&
      communityId !== 'events' &&
      communityId !== 'messages'
    ) {
      dispatch(fetchCommunity(communityId));
    }
  }, [dispatch, communityId]);

  if (user && user.communityOnboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // Spinner only while a first fetch is in progress / pending.
  if ((status === 'idle' || status === 'loading') && list.length === 0) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  if (status === 'failed' && list.length === 0) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <CommunitiesLoadError message={error} onRetry={() => dispatch(fetchCommunities())} />
      </div>
    );
  }

  // status === 'succeeded' (list may be empty) — render shell; index route shows empty home.
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

  return <CommunityShell />;
}
