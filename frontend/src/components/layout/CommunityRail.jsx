import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useParams } from 'react-router-dom';
import { fetchCommunities } from '../../features/communities/communitiesSlice';
import { communityAvatar } from '../../lib/avatars';
import UserAvatar from '../UserAvatar';
import { SparkleIcon, ShieldIcon } from '../icons';

export default function CommunityRail() {
  const dispatch = useDispatch();
  const { communityId, tab } = useParams();
  const currentTab = tab || 'chat';
  const list = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!list.length) dispatch(fetchCommunities());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

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
      {c._id === communityId && (
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
    <aside className="w-[72px] bg-base-200 flex flex-col border-r border-base-content/10 shrink-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-3 gap-2">
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
      </div>

      {/* Profile menu — outside scroll area so dropdown overlays the shell */}
      <div className="shrink-0 py-3 flex justify-center relative" ref={menuRef}>
        <button
          type="button"
          className="cursor-pointer"
          title={user?.username}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <UserAvatar user={user} className="w-10 rounded-full" />
        </button>

        {menuOpen && (
          <ul className="absolute left-[calc(100%+8px)] bottom-0 menu bg-base-100 rounded-box z-[200] w-44 p-2 shadow-xl border border-base-content/10">
            <li>
              <NavLink to="/settings" onClick={() => setMenuOpen(false)}>
                Settings
              </NavLink>
            </li>
            {user?.moderator && (
              <li>
                <NavLink to="/c/moderator" onClick={() => setMenuOpen(false)}>
                  <ShieldIcon /> Moderator
                </NavLink>
              </li>
            )}
            {!user?.scheduleUploaded && (
              <li>
                <NavLink to="/schedule" onClick={() => setMenuOpen(false)}>
                  Add schedule
                </NavLink>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
