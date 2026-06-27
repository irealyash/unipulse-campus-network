import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatalog, joinCommunity } from '../features/communities/communitiesSlice';
import { CATALOG_CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT } from '../lib/communityCategories';
import { communityAvatar } from '../lib/avatars';
import CourseCommunityAvatar from './CourseCommunityAvatar';
import Loader from './Loader';
import { SearchIcon } from './icons';

/**
 * Pick a category then add a public catalog community to the navbar.
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.initialCategory]
 */
export default function AddCommunityModal({ open, onClose, initialCategory = null }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const catalog = useSelector((s) => s.communities.catalog);
  const catalogStatus = useSelector((s) => s.communities.catalogStatus);
  const joined = user?.joinedCommunities || [];

  const [step, setStep] = useState(initialCategory ? 'pick' : 'category');
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setStep(initialCategory ? 'pick' : 'category');
      setCategory(initialCategory);
      setSearch('');
      setQuery('');
    }
  }, [open, initialCategory]);

  useEffect(() => {
    if (open && step === 'pick' && category) {
      dispatch(fetchCatalog({ category, search: query }));
    }
  }, [dispatch, open, step, category, query]);

  if (!open) return null;

  const pickCategory = (cat) => {
    setCategory(cat);
    setStep('pick');
    setSearch('');
    setQuery('');
  };

  const runSearch = (e) => {
    e?.preventDefault?.();
    setQuery(search.trim());
  };

  const addCommunity = (c) => {
    if (joined.includes(c._id)) {
      onClose();
      return;
    }
    dispatch(joinCommunity(c));
    onClose();
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
                  className="btn btn-outline justify-start rounded-2xl h-auto py-3"
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
            <form onSubmit={runSearch} className="flex gap-2 mt-3">
              <input
                className="input input-bordered input-sm rounded-full flex-1"
                placeholder={`Search ${CATEGORY_SHORT[category]?.toLowerCase() || 'communities'}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch(e);
                  }
                }}
              />
              <button type="submit" className="btn btn-primary btn-sm btn-circle">
                <SearchIcon />
              </button>
            </form>
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
                        <img
                          src={communityAvatar(c)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium truncate flex-1 min-w-0">{c.name}</span>
                      <button
                        type="button"
                        className={`btn btn-xs rounded-full ${already ? 'btn-ghost' : 'btn-primary'}`}
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
