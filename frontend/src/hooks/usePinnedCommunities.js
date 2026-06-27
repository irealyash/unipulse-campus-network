import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { joinCommunity, leaveCommunity } from '../features/communities/communitiesSlice';

/** Server-backed navbar communities (joined catalog + course sections in list). */
export default function usePinnedCommunities() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const pinnedIds = user?.joinedCommunities || [];

  const isPinned = useCallback((id) => pinnedIds.includes(id), [pinnedIds]);

  const togglePin = useCallback(
    (id, community) => {
      if (community?.type === 'course') return;
      if (pinnedIds.includes(id)) {
        dispatch(leaveCommunity(id));
      } else {
        dispatch(joinCommunity(id));
      }
    },
    [dispatch, pinnedIds]
  );

  return { pinnedIds, togglePin, isPinned };
}
