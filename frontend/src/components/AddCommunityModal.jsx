/**
 * AddCommunityModal — two-step modal for discovering and joining public
 * communities from the catalog:
 *   Step 1 ("category"): user picks a category (e.g. International, Academic)
 *   Step 2 ("pick"):     filtered, searchable list of communities in that category
 *
 * Adding a community dispatches joinCommunity, which adds it to the user's
 * navbar. Already-joined communities are shown as "Added".
 *
 * Props:
 * @param {boolean}   open             — controls modal visibility
 * @param {() => void} onClose         — close callback
 * @param {string}    [initialCategory]— skip step 1 and go straight to this category
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalog, joinCommunity } from '../features/communities/communitiesSlice';
import { CATALOG_CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT } from '../lib/communityCategories';
import CommunityAvatar from './CommunityAvatar';
import Loader from './Loader';
import { SearchIcon } from './icons';
import useDebouncedValue from '../hooks/useDebouncedValue';

export default function AddCommunityModal({ open, onClose, initialCategory = null }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  // List of communities in the selected category from Redux
  const catalog = useSelector((s) => s.communities.catalog);
  const catalogStatus = useSelector((s) => s.communities.catalogStatus);
  // Community ids the user has already joined
  const joined = user?.joinedCommunities || [];

  // Current modal step: "category" or "pick"
  const [step, setStep] = useState(initialCategory ? 'pick' : 'category');
  // Selected category id
  const [category, setCategory] = useState(initialCategory);
  // Search query text
  const [search, setSearch] = useState('');
  // Debounced search value to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(search, 250);

  // Reset modal state when it opens/closes
  useEffect(() => {
    if (!open) {
      setStep(initialCategory ? 'pick' : 'category');
      setCategory(initialCategory);
      setSearch('');
    }
  }, [open, initialCategory]);

  // Fetch catalog whenever category or search changes
  useEffect(() => {
    if (open && step === 'pick' && category) {
      dispatch(fetchCatalog({ category, search: debouncedSearch.trim() }));
    }
  }, [dispatch, open, step, category, debouncedSearch]);

  if (!open) return null;

  // User selects a category — advance to the pick step
  const pickCategory = (cat) => {
    setCategory(cat);
    setStep('pick');
    setSearch('');
  };

  // Join a community (adds it to the user's navbar)
  const addCommunity = (c) => {
    if (!joined.includes(c._id)) {
      dispatch(joinCommunity(c));
    }
  };

  return (
    <div className="modal modal-open z-[200]">
      <div className="modal-box max-w-lg rounded-3xl">
        {step === 'category' ? (
          <>
            <h3 className="font-bold text-lg">Add a community</h3>
            <p className="text-sm text-base-content/60 mt-1">Choose a category</p>
            <div className="grid gap-2 mt-4">
              {CATALOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="btn btn-outline btn-primary justify-start rounded-2xl h-auto py-3 w-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => pickCategory(cat)}
                >
                  <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              className="text-sm text-primary link link-hover mb-2"
              onClick={() => {
                if (initialCategory) onClose();
                else setStep('category');
              }}
            >
              ← {initialCategory ? 'Cancel' : 'Categories'}
            </button>
            <h3 className="font-bold text-lg">{CATEGORY_LABELS[category]}</h3>
            <div className="flex gap-2 mt-3">
              <input
                className="input input-bordered input-sm rounded-full flex-1"
                placeholder={`Search ${CATEGORY_SHORT[category]?.toLowerCase() || 'communities'}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search communities"
              />
              <span className="btn btn-primary btn-sm btn-circle pointer-events-none" aria-hidden>
                <SearchIcon />
              </span>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
              {catalogStatus === 'loading' && <Loader label="Loading…" />}
              {catalogStatus !== 'loading' &&
                catalog.map((c) => {
                  const already = joined.includes(c._id);
                  return (
                    <div
                      key={c._id}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-base-200/80"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <CommunityAvatar community={c} className="w-full h-full" boxPx={32} />
                      </div>
                      <span className="text-sm font-medium truncate flex-1 min-w-0">{c.name}</span>
                      <button
                        type="button"
                        className={`btn btn-xs rounded-full ${already ? 'btn-success btn-outline' : 'btn-primary'}`}
                        disabled={already}
                        onClick={() => addCommunity(c)}
                      >
                        {already ? 'Added' : 'Add'}
                      </button>
                    </div>
                  );
                })}
            </div>
          </>
        )}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost rounded-2xl" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
