/**
 * CommunityOnboardingPage.jsx
 *
 * Post-signup onboarding wizard.
 * Route: "/onboarding"
 * Role: Guides newly verified users through picking communities from each
 * category (international, academic, faculty, etc.) and optionally uploading
 * their UBC schedule. Once complete, marks onboarding done and redirects to /c.
 */

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

  // Reads the current user object to check onboarding status and joined communities
  const user = useSelector((s) => s.auth.user);
  // Reads the community catalog list and its loading status from Redux
  const catalog = useSelector((s) => s.communities.catalog);
  const catalogStatus = useSelector((s) => s.communities.catalogStatus);
  // List of community IDs the user has already joined
  const joined = user?.joinedCommunities || [];

  // Wizard state: "communities" phase (picking from categories) or "schedule" phase
  const [phase, setPhase] = useState('communities');
  // Current step index within the ONBOARDING_STEPS array
  const [stepIndex, setStepIndex] = useState(0);
  // Search input for filtering communities within the current category
  const [search, setSearch] = useState('');
  // Debounced search value to avoid excessive API calls on every keystroke
  const debouncedSearch = useDebouncedValue(search, 250);

  // Current step configuration (label, category id) from the onboarding steps array
  const step = ONBOARDING_STEPS[stepIndex];
  const category = step?.id;
  // Total steps = category steps + 1 for the schedule upload step
  const totalSteps = ONBOARDING_STEPS.length + 1;

  /**
   * useEffect: Fetches the community catalog for the current category.
   * Runs whenever the phase is "communities" and category or search changes.
   * Uses the debounced search value to reduce API requests.
   */
  useEffect(() => {
    if (phase === 'communities' && category) {
      dispatch(fetchCatalog({ category, search: debouncedSearch.trim() }));
    }
  }, [dispatch, phase, category, debouncedSearch]);

  // If user already completed onboarding, redirect to the community hub
  if (user?.communityOnboardingComplete) {
    return <Navigate to="/c" replace />;
  }

  /**
   * Handler: finishes the onboarding flow.
   * Marks onboarding complete on the server, refreshes communities, and navigates to /c.
   */
  const finish = async () => {
    await dispatch(completeCommunityOnboarding());
    await dispatch(fetchCommunities());
    navigate('/c', { replace: true });
  };

  /** Handler: transitions from community-picking phase to the schedule upload phase. */
  const goToSchedule = () => {
    setPhase('schedule');
    setSearch('');
  };

  /** Handler: advances to the next onboarding step, or moves to schedule if all done. */
  const nextStep = () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) goToSchedule();
    else {
      setStepIndex((i) => i + 1);
      setSearch('');
    }
  };

  /** Handler: skips the current category step (same as nextStep). */
  const skipStep = () => nextStep();

  /**
   * Handler: adds a community to the user's joined list.
   * Triggered when the user clicks "Add" on a community tile.
   */
  const addCommunity = (c) => {
    if (!joined.includes(c._id)) {
      dispatch(joinCommunity(c));
    }
  };

  /**
   * Handler: called when the schedule upload succeeds.
   * Refreshes communities (to include newly unlocked course rooms) then finishes onboarding.
   */
  const onScheduleSuccess = async () => {
    await dispatch(fetchCommunities());
    await finish();
  };

  // Render the schedule upload phase
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

  // Render the community-picking phase
  return (
    <AuthShell
      title="Pick your communities"
      subtitle={`Step ${stepIndex + 1} of ${totalSteps} · ${step.label}`}
    >
      <p className="text-sm text-base-content/70 mb-3">
        Add a community to pin it to your sidebar. You can skip any step and add more later from
        the home page.
      </p>

      {/* Search bar — filters communities within the current category */}
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

      {/* Scrollable community list for the current category */}
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
                {/* Add/Added toggle button */}
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

      {/* Navigation buttons — Skip and Continue */}
      <div className="flex flex-wrap gap-2 mt-5">
        <button type="button" className="btn btn-ghost rounded-2xl flex-1" onClick={skipStep}>
          Skip
        </button>
        <button type="button" className="btn btn-primary rounded-2xl flex-1" onClick={nextStep}>
          {stepIndex >= ONBOARDING_STEPS.length - 1 ? 'Continue to schedule' : 'Continue'}
        </button>
      </div>

      {/* Link to skip all remaining category steps at once */}
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
