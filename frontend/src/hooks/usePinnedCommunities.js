/**
 * usePinnedCommunities HOOK
 * ----------------------------------------------------------------------------
 * Provides pinning/unpinning functionality for navbar communities.
 * "Pinned" communities are the user's explicitly joined catalog communities
 * (stored server-side in user.joinedCommunities). Course communities cannot
 * be pinned/unpinned since they are enrollment-based.
 *
 * @returns {{
 *   pinnedIds: string[],         - Ordered array of pinned community IDs
 *   togglePin: (id: string, community?: Object) => void, - Join/leave toggle (no-op for courses)
 *   isPinned: (id: string) => boolean - Check if a community is currently pinned
 * }}
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { joinCommunity, leaveCommunity } from '../features/communities/communitiesSlice';

export default function usePinnedCommunities() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  /** The current user's joined community IDs (serves as the "pinned" list). */
  const pinnedIds = user?.joinedCommunities || [];

  /** Check whether a community ID is in the user's pinned list. */
  const isPinned = useCallback((id) => pinnedIds.includes(id), [pinnedIds]);

  /**
   * Toggle a community's pinned status by dispatching join or leave.
   * Course communities are ignored (they cannot be manually pinned/unpinned).
   */
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
