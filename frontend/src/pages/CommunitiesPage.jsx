/**
 * CommunitiesPage.jsx
 *
 * Community listing page (card grid view).
 * Route: "/communities"
 * Role: Displays all communities the user can access, split into General and
 * Course sections. Each community links to its group chat. Also includes a
 * schedule-upload nudge if the user hasn't uploaded yet, and a button to
 * suggest a new community (opens RequestModeratorModal).
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCommunities } from '../features/communities/communitiesSlice';
import Loader from '../components/Loader';
import RequestModeratorModal from '../components/RequestModeratorModal';
import { ChatIcon, CalendarIcon, UsersIcon, InboxIcon } from '../components/icons';

/** A single community tile linking to its group chat. */
function CommunityCard({ c }) {
  const isCourse = c.type === 'course';
  return (
    <Link
      to={`/communities/${encodeURIComponent(c._id)}`}
      className="card bg-base-100 border border-base-content/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition group"
    >
      <div className="card-body p-5">
        {/* Top row — avatar icon and type badge */}
        <div className="flex items-start justify-between gap-2">
          <div
            className={`avatar avatar-placeholder ${
              isCourse ? 'text-secondary' : 'text-primary'
            }`}
          >
            <div
              className={`w-12 rounded-2xl ${
                isCourse ? 'bg-secondary/15' : 'bg-primary/15'
              } grid place-items-center text-xl`}
            >
              {isCourse ? <CalendarIcon /> : <UsersIcon />}
            </div>
          </div>
          <span className={`badge ${isCourse ? 'badge-secondary' : 'badge-primary'} badge-sm`}>
            {isCourse ? 'Course' : 'General'}
          </span>
        </div>

        {/* Community name and optional description */}
        <h3 className="card-title text-base mt-2">{c.name}</h3>
        {c.description && (
          <p className="text-sm text-base-content/60 line-clamp-2">{c.description}</p>
        )}

        {/* "Open chat" CTA */}
        <div className="card-actions mt-2">
          <span className="btn btn-sm btn-primary btn-soft rounded-full gap-1 group-hover:btn-primary">
            <ChatIcon /> Open chat
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Lists all communities the user can access, split into General and Course
 * rooms. (Posts & events tabs are intentionally not built yet — chat only.)
 */
export default function CommunitiesPage() {
  const dispatch = useDispatch();

  // Reads the community list and its loading status from Redux
  const { list, status } = useSelector((s) => s.communities);
  // Reads the user object to check schedule upload status
  const user = useSelector((s) => s.auth.user);
  // Controls visibility of the "suggest a community" modal
  const [requestOpen, setRequestOpen] = useState(false);

  /**
   * useEffect: Fetches the full community list on mount.
   * Runs once when the component mounts.
   */
  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  // Split communities into General and Course categories for display
  const general = list.filter((c) => c.type !== 'course');
  const courses = list.filter((c) => c.type === 'course');

  return (
    <div>
      {/* Page header — title, subtitle, and "Suggest a community" button */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Communities</h1>
          <p className="text-base-content/60">Hop into a room and start chatting, anonymously.</p>
        </div>
        <button className="btn btn-outline btn-primary rounded-full gap-2" onClick={() => setRequestOpen(true)}>
          <InboxIcon /> Suggest a community
        </button>
      </div>

      {/* Schedule upload nudge — shown if user hasn't uploaded their schedule yet */}
      {user && !user.scheduleUploaded && (
        <div className="alert bg-secondary/10 border border-secondary/20 rounded-3xl mb-6">
          <CalendarIcon className="text-secondary text-xl" />
          <div>
            <h3 className="font-semibold">Unlock your course communities</h3>
            <div className="text-sm text-base-content/60">
              Add your class schedule to join private rooms for each of your courses.
            </div>
          </div>
          <Link to="/schedule" className="btn btn-secondary btn-sm rounded-full">
            Add schedule
          </Link>
        </div>
      )}

      {/* Loading state */}
      {status === 'loading' && <Loader label="Loading communities…" />}

      {status !== 'loading' && (
        <>
          {/* General communities section */}
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <UsersIcon className="text-primary" /> General
            </h2>
            {general.length === 0 ? (
              <p className="text-base-content/50 text-sm">No general communities yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {general.map((c) => (
                  <CommunityCard key={c._id} c={c} />
                ))}
              </div>
            )}
          </section>

          {/* Course communities section */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CalendarIcon className="text-secondary" /> Your courses
            </h2>
            {courses.length === 0 ? (
              <div className="card bg-base-100 border border-dashed border-base-300 rounded-3xl">
                <div className="card-body items-center text-center text-base-content/60">
                  <CalendarIcon className="text-3xl text-secondary" />
                  <p>No course communities yet.</p>
                  <Link to="/schedule" className="btn btn-secondary btn-sm rounded-full mt-1">
                    Upload your schedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => (
                  <CommunityCard key={c._id} c={c} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modal for suggesting/requesting a new community */}
      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
