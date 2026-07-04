import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { fetchCommunities, fetchCommunity } from '../features/communities/communitiesSlice';
import CommunityShell from '../components/layout/CommunityShell';
import Loader from '../components/Loader';
import { communityChatPath, pickDefaultCommunityId } from '../lib/communityNav';
import { filterNavbarCommunities } from '../lib/navbarCommunities';
import CommunityHomeEmpty from './CommunityHomeEmpty';

/** Redirect /c to the first available community's chat, or show an empty home. */
export function CommunityRedirect() {
  const rawList = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const list = filterNavbarCommunities(rawList, user);
  const status = useSelector((s) => s.communities.status);

  if (status === 'loading') {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader label="Loading communities…" />
      </div>
    );
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
  const rawList = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const list = filterNavbarCommunities(rawList, user);
  const status = useSelector((s) => s.communities.status);

  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  useEffect(() => {
    if (communityId && communityId !== 'moderator') {
      dispatch(fetchCommunity(communityId));
    }
  }, [dispatch, communityId]);

  if (user && user.communityOnboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  if (status === 'loading' && !list.length) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <Loader label="Loading communities…" />
      </div>
    );
  }

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
