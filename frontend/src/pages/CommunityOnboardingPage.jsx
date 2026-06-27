import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchCatalog, joinCommunity } from '../features/communities/communitiesSlice';
import { completeCommunityOnboarding } from '../features/auth/authSlice';
import { fetchCommunities } from '../features/communities/communitiesSlice';
import { ONBOARDING_STEPS } from '../lib/communityCategories';
import { communityAvatar } from '../lib/avatars';
import AuthShell from '../components/AuthShell';
import Loader from '../components/Loader';
import { SearchIcon } from '../components/icons';

/**
 * Post-signup wizard: pick communities from each catalog category (skippable).
 */
export default function CommunityOnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const catalog = useSelector((s) => s.communities.catalog);
  const catalogStatus = useSelector((s) => s.communities.catalogStatus);
  const joined = user?.joinedCommunities || [];

  const [stepIndex, setStepIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const step = ONBOARDING_STEPS[stepIndex];
  const category = step?.id;

  useEffect(() => {
    if (category) {
      dispatch(fetchCatalog({ category, search: query }));
    }
  }, [dispatch, category, query]);

  if (user?.communityOnboardingComplete) {
    return <Navigate to="/c" replace />;
  }

  const finish = async () => {
    await dispatch(completeCommunityOnboarding());
    await dispatch(fetchCommunities());
    navigate('/c', { replace: true });
  };

  const nextStep = () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) finish();
    else {
      setStepIndex((i) => i + 1);
      setSearch('');
      setQuery('');
    }
  };

  const skipStep = () => nextStep();

  const runSearch = (e) => {
    e?.preventDefault?.();
    setQuery(search.trim());
  };

  const addCommunity = (c) => {
    if (!joined.includes(c._id)) {
      dispatch(joinCommunity(c));
    }
  };

  if (!step) return null;

  return (
    <AuthShell
      title="Pick your communities"
      subtitle={`Step ${stepIndex + 1} of ${ONBOARDING_STEPS.length} · ${step.label}`}
    >
      <p className="text-sm text-base-content/70 mb-3">
        Add a community to pin it to your sidebar. You can skip any step and add more later from
        the home page.
      </p>

      <form onSubmit={runSearch} className="flex gap-2 mb-3">
        <input
          className="input input-bordered rounded-full flex-1 input-sm"
          placeholder="Search…"
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

      <div className="max-h-64 overflow-y-auto space-y-1 border border-base-content/10 rounded-2xl p-2">
        {catalogStatus === 'loading' && <Loader label="Loading communities…" />}
        {catalogStatus !== 'loading' &&
          catalog.map((c) => {
            const already = joined.includes(c._id);
            return (
              <div
                key={c._id}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-base-200/60"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                  <img src={communityAvatar(c)} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium truncate flex-1 min-w-0">{c.name}</span>
                <button
                  type="button"
                  className={`btn btn-xs rounded-full ${already ? 'btn-success btn-outline' : 'btn-primary'}`}
                  onClick={() => addCommunity(c)}
                >
                  {already ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        <button type="button" className="btn btn-ghost rounded-2xl flex-1" onClick={skipStep}>
          Skip
        </button>
        <button type="button" className="btn btn-primary rounded-2xl flex-1" onClick={nextStep}>
          {stepIndex >= ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Continue'}
        </button>
      </div>

      <button
        type="button"
        className="btn btn-link btn-xs w-full mt-2 text-base-content/50"
        onClick={finish}
      >
        Skip all and go to home
      </button>
    </AuthShell>
  );
}
