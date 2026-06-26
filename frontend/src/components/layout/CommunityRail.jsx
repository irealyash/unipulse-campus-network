import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useParams } from 'react-router-dom';
import { fetchCommunities } from '../../features/communities/communitiesSlice';
import { communityAvatar } from '../../lib/avatars';
import { SparkleIcon } from '../icons';

/**
 * Extreme-left community rail (Discord server list). Circular community icons;
 * active community gets a pill indicator.
 */
export default function CommunityRail() {
  const dispatch = useDispatch();
  const { communityId, tab } = useParams();
  const currentTab = tab || 'chat';
  const list = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (!list.length) dispatch(fetchCommunities());
  }, [dispatch, list.length]);

  const general = list.filter((c) => c.type !== 'course');
  const courses = list.filter((c) => c.type === 'course');

  const Item = ({ c }) => (
    <NavLink
      to={`/c/${encodeURIComponent(c._id)}/${currentTab}`}
      title={c.name}
      className={({ isActive }) =>
        `group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all hover:rounded-xl ${
          isActive || c._id === communityId
            ? 'rounded-xl ring-2 ring-primary'
            : 'hover:bg-primary/20'
        }`
      }
    >
      {(c._id === communityId) && (
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-base-content rounded-r-full" />
      )}
      <div className="avatar">
        <div className="w-12 h-12 rounded-2xl group-hover:rounded-xl transition-all">
          <img src={communityAvatar(c)} alt={c.name} />
        </div>
      </div>
    </NavLink>
  );

  return (
    <aside className="w-[72px] bg-base-200 flex flex-col items-center py-3 gap-2 border-r border-base-content/10 overflow-y-auto shrink-0">
      <NavLink
        to="/c/general/chat"
        className="btn btn-ghost btn-circle btn-sm text-primary mb-1"
        title="UniPulse home"
      >
        <SparkleIcon className="text-xl" />
      </NavLink>

      <div className="w-8 h-0.5 bg-base-content/10 rounded-full" />

      {general.map((c) => (
        <Item key={c._id} c={c} />
      ))}

      {courses.length > 0 && (
        <>
          <div className="w-8 h-0.5 bg-base-content/10 rounded-full my-1" />
          {courses.map((c) => (
            <Item key={c._id} c={c} />
          ))}
        </>
      )}

      <div className="flex-1" />

      {/* User avatar at bottom of rail */}
      <div className="dropdown dropdown-top dropdown-end">
        <div tabIndex={0} className="avatar cursor-pointer" title={user?.username}>
          <div className="w-10 rounded-full bg-primary text-primary-content">
            <span>{user?.username?.[0]?.toUpperCase()}</span>
          </div>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-50 w-44 p-2 shadow-xl mb-2 left-14"
        >
          <li>
            <NavLink to="/settings">Settings</NavLink>
          </li>
          {user?.moderator && (
            <li>
              <NavLink to="/moderator">Moderator</NavLink>
            </li>
          )}
          {!user?.scheduleUploaded && (
            <li>
              <NavLink to="/schedule">Add schedule</NavLink>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
