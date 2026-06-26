import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom';
import { fetchCommunities, fetchCommunity } from '../features/communities/communitiesSlice';
import CommunityShell from '../components/layout/CommunityShell';
import Loader from '../components/Loader';

/** Redirect /c to the first available community's chat. */
export function CommunityRedirect() {
  const list = useSelector((s) => s.communities.list);
  const target = list.find((c) => c._id === 'general')?._id || list[0]?._id || 'general';
  return <Navigate to={`/c/${encodeURIComponent(target)}/chat`} replace />;
}

/** Loads communities then renders the Discord-style shell. */
export default function CommunityHub() {
  const dispatch = useDispatch();
  const { communityId } = useParams();
  const list = useSelector((s) => s.communities.list);
  const status = useSelector((s) => s.communities.status);

  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  useEffect(() => {
    if (communityId) dispatch(fetchCommunity(communityId));
  }, [dispatch, communityId]);

  if (status === 'loading' && !list.length) {
    return (
      <div className="h-screen grid place-items-center bg-base-300">
        <Loader label="Loading communities…" />
      </div>
    );
  }

  // Unknown community id -> fall back to general
  if (communityId && list.length && !list.some((c) => c._id === communityId)) {
    return <Navigate to="/c/general/chat" replace />;
  }

  return <CommunityShell />;
}
