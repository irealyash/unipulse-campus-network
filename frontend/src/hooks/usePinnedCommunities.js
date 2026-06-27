import { useCallback, useEffect, useState } from 'react';
import {
  getPinnedCommunityIds,
  PINS_CHANGED_EVENT,
  togglePinCommunity,
} from '../lib/communityPins';

export default function usePinnedCommunities() {
  const [pinnedIds, setPinnedIds] = useState(getPinnedCommunityIds);

  const refresh = useCallback(() => {
    setPinnedIds(getPinnedCommunityIds());
  }, []);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(PINS_CHANGED_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(PINS_CHANGED_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [refresh]);

  const togglePin = useCallback(
    (id) => {
      togglePinCommunity(id);
      refresh();
    },
    [refresh]
  );

  const isPinned = useCallback((id) => pinnedIds.includes(id), [pinnedIds]);

  return { pinnedIds, togglePin, isPinned };
}
