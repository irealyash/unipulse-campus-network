const STORAGE_KEY = 'unipulse_pinned_communities';
export const PINS_CHANGED_EVENT = 'unipulse:pins-changed';

export function getPinnedCommunityIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function pinCommunity(id) {
  const pins = getPinnedCommunityIds();
  if (!pins.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pins, id]));
    window.dispatchEvent(new Event(PINS_CHANGED_EVENT));
  }
}

export function unpinCommunity(id) {
  const pins = getPinnedCommunityIds().filter((x) => x !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  window.dispatchEvent(new Event(PINS_CHANGED_EVENT));
}

export function togglePinCommunity(id) {
  const pins = getPinnedCommunityIds();
  if (pins.includes(id)) unpinCommunity(id);
  else pinCommunity(id);
}

/** Unpinned: private course → private general → public. Pinned always first (pin order). */
function sortGroup(c) {
  if (c.private && c.type === 'course') return 0;
  if (c.private) return 1;
  return 2;
}

export function sortCommunities(list, pinnedIds = getPinnedCommunityIds()) {
  const pinIndex = new Map(pinnedIds.map((id, i) => [id, i]));

  return [...list].sort((a, b) => {
    const aPin = pinIndex.get(a._id);
    const bPin = pinIndex.get(b._id);
    const aPinned = aPin !== undefined;
    const bPinned = bPin !== undefined;

    if (aPinned && bPinned) return aPin - bPin;
    if (aPinned) return -1;
    if (bPinned) return 1;

    const groupDiff = sortGroup(a) - sortGroup(b);
    if (groupDiff !== 0) return groupDiff;

    return (a.name || a._id).localeCompare(b.name || b._id, undefined, { sensitivity: 'base' });
  });
}
