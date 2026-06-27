import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchCatalog, joinCommunity, fetchCommunities } from '../features/communities/communitiesSlice';
import { completeCommunityOnboarding } from '../features/auth/authSlice';
import { ONBOARDING_STEPS } from '../lib/communityCategories';
import AuthShell from '../components/AuthShell';
import CommunityAvatar from '../components/CommunityAvatar';
import Loader from '../components/Loader';
import ScheduleUploadCard from '../components/ScheduleUploadCard';
import { SearchIcon } from '../components/icons';
import useDebouncedValue from '../hooks/useDebouncedValue';

/**
 * Post-signup wizard: pick communities from each catalog category, then optional schedule upload.
 */
export default function CommunityOnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const catalog = useSelector((s) => s.communities.catalog);
  const catalogStatus = useSelector((s) => s.communities.catalogStatus);
  const joined = user?.joinedCommunities || [];

  const [phase, setPhase] = useState('communities');
  const [stepIndex, setStepIndex] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const step = ONBOARDING_STEPS[stepIndex];
  const category = step?.id;
  const totalSteps = ONBOARDING_STEPS.length + 1;

  useEffect(() => {
    if (phase === 'communities' && category) {
      dispatch(fetchCatalog({ category, search: debouncedSearch.trim() }));
    }
  }, [dispatch, phase, category, debouncedSearch]);

  if (user?.communityOnboardingComplete) {
    return <Navigate to="/c" replace />;
  }

  const finish = async () => {
    await dispatch(completeCommunityOnboarding());
    await dispatch(fetchCommunities());
    navigate('/c', { replace: true });
  };

  const goToSchedule = () => {
    setPhase('schedule');
    setSearch('');
  };

  const nextStep = () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) goToSchedule();
    else {
      setStepIndex((i) => i + 1);
      setSearch('');
    }
  };

  const skipStep = () => nextStep();

  const addCommunity = (c) => {
    if (!joined.includes(c._id)) {
      dispatch(joinCommunity(c));
    }
  };

  const onScheduleSuccess = async () => {
    await dispatch(fetchCommunities());
    await finish();
  };

  if (phase === 'schedule') {
    return (
      <AuthShell
        title=""
        subtitle={`Step ${totalSteps} of ${totalSteps} · Optional`}
      >
        <ScheduleUploadCard onSkip={finish} onSuccess={onScheduleSuccess} />
      </AuthShell>
    );
  }

  if (!step) return null;

  return (
    <AuthShell
      title="Pick your communities"
      subtitle={`Step ${stepIndex + 1} of ${totalSteps} · ${step.label}`}
    >
      <p className="text-sm text-base-content/70 mb-3">
        Add a community to pin it to your sidebar. You can skip any step and add more later from
        the home page.
      </p>

      <div className="flex gap-2 mb-3">
        <input
          className="input input-bordered rounded-full flex-1 input-sm"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search communities"
        />
        <span className="btn btn-primary btn-sm btn-circle pointer-events-none" aria-hidden>
          <SearchIcon />
        </span>
      </div>

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
                  <CommunityAvatar community={c} className="w-full h-full" boxPx={36} />
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
          {stepIndex >= ONBOARDING_STEPS.length - 1 ? 'Continue to schedule' : 'Continue'}
        </button>
      </div>

      <button
        type="button"
        className="btn btn-link btn-xs w-full mt-2 text-base-content/50"
        onClick={goToSchedule}
      >
        Skip remaining categories
      </button>
    </AuthShell>
  );
}
