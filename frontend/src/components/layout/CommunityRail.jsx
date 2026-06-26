import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useParams } from 'react-router-dom';
import { fetchCommunities } from '../../features/communities/communitiesSlice';
import { communityAvatar } from '../../lib/avatars';
import CourseCommunityAvatar from '../CourseCommunityAvatar';
import UserAvatar from '../UserAvatar';
import { ShieldIcon, ChevronIcon } from '../icons';

export default function CommunityRail({ sidebarOpen, onToggleSidebar }) {
  const dispatch = useDispatch();
  const { communityId, tab } = useParams();
  const currentTab = tab || 'chat';
  const list = useSelector((s) => s.communities.list);
  const user = useSelector((s) => s.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, bottom: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (!list.length) dispatch(fetchCommunities());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      const menu = document.getElementById('rail-profile-menu');
      if (menu?.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const toggleMenu = () => {
    if (!menuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ left: r.right + 8, bottom: window.innerHeight - r.bottom });
    }
    setMenuOpen((o) => !o);
  };

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
      <div className="w-12 h-12 rounded-2xl overflow-hidden group-hover:rounded-xl transition-all">
        {c.type === 'course' ? (
          <CourseCommunityAvatar sectionId={c._id} className="w-full h-full" boxPx={48} />
        ) : (
          <img src={communityAvatar(c)} alt={c.name} className="w-full h-full object-cover" />
        )}
      </div>
    </NavLink>
  );

  const profileMenu =
    menuOpen &&
    createPortal(
      <ul
        id="rail-profile-menu"
        className="menu bg-base-100 rounded-box z-[300] w-44 p-2 shadow-xl border border-base-content/10 fixed"
        style={{ left: menuPos.left, bottom: menuPos.bottom }}
      >
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
      </ul>,
      document.body
    );

  return (
    <aside className="w-[72px] bg-base-200 flex flex-col border-r border-base-content/10 shrink-0">
      <div className="shrink-0 py-2 flex justify-center">
        <button
          type="button"
          className="btn btn-ghost btn-circle btn-sm"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Hide channels' : 'Show channels'}
          aria-label="Toggle channel sidebar"
          aria-expanded={sidebarOpen}
        >
          <ChevronIcon
            className={`text-lg transition-transform duration-200 ${
              sidebarOpen ? 'rotate-90' : '-rotate-90'
            }`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-1 gap-2">
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

      <div className="shrink-0 py-3 flex justify-center">
        <button
          ref={btnRef}
          type="button"
          className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 ring-primary"
          title={user?.username}
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <UserAvatar user={user} className="w-10 h-10" />
        </button>
      </div>

      {profileMenu}
    </aside>
  );
}
