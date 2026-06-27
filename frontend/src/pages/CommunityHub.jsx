import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { fetchCommunities, fetchCommunity } from '../features/communities/communitiesSlice';
import CommunityShell from '../components/layout/CommunityShell';
import Loader from '../components/Loader';
import { communityChatPath, pickDefaultCommunityId } from '../lib/communityNav';

/** Redirect /c to the first available community's chat. */
export function CommunityRedirect() {
  const list = useSelector((s) => s.communities.list);
  const status = useSelector((s) => s.communities.status);
  const user = useSelector((s) => s.auth.user);

  if (status === 'loading' || (status === 'idle' && !list.length)) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  const target = pickDefaultCommunityId(list, user);
  if (target) {
    return <Navigate to={communityChatPath(target)} replace />;
  }

  return <Navigate to="/schedule" replace />;
}

/** Loads communities then renders the Discord-style shell. */
export default function CommunityHub() {
  const dispatch = useDispatch();
  const { communityId } = useParams();
  const list = useSelector((s) => s.communities.list);
  const status = useSelector((s) => s.communities.status);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  useEffect(() => {
    if (communityId && communityId !== 'moderator') {
      dispatch(fetchCommunity(communityId));
    }
  }, [dispatch, communityId]);

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
    list.length > 0 &&
    !inList &&
    !enrolled &&
    !user?.moderator
  ) {
    const fallback = pickDefaultCommunityId(list, user);
    if (fallback) {
      return <Navigate to={communityChatPath(fallback)} replace />;
    }
  }

  return <CommunityShell />;
}
