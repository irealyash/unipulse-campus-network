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
  const railCommunities = [...general, ...courses];

  const RailCommunityItem = ({ c }) => {
    const itemRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [tipPos, setTipPos] = useState({ top: 0, left: 0 });
    const selected = c._id === communityId;

    const updateTipPos = () => {
      if (!itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      setTipPos({ top: rect.top + rect.height / 2, left: rect.right + 3 });
    };

    useEffect(() => {
      if (!hovered) return;
      updateTipPos();
      const onScroll = () => updateTipPos();
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onScroll);
      };
    }, [hovered]);

    const tooltip =
      hovered &&
      createPortal(
        <div
          className="fixed z-[400] pointer-events-none -translate-y-1/2 flex items-center"
          style={{ top: tipPos.top, left: tipPos.left }}
          role="tooltip"
        >
          <svg
            width="6"
            height="12"
            viewBox="0 0 6 12"
            className="shrink-0 text-base-100 -mr-px"
            aria-hidden
          >
            <path
              fill="currentColor"
              shapeRendering="geometricPrecision"
              d="M6 0.75 L1.12 5.72 A0.32 0.32 0 0 0 1.12 6.28 L6 11.25 Z"
            />
          </svg>
          <div className="bg-base-100 text-base-content text-sm font-semibold px-3 py-1.5 rounded-[5px] shadow-xl whitespace-nowrap max-w-[14rem] truncate">
            {c.name}
          </div>
        </div>,
        document.body
      );

    return (
      <>
        <div
          ref={itemRef}
          className="relative"
          onMouseEnter={() => {
            updateTipPos();
            setHovered(true);
          }}
          onMouseLeave={() => setHovered(false)}
        >
          <NavLink
            to={`/c/${encodeURIComponent(c._id)}/${currentTab}`}
            onMouseDown={(e) => e.preventDefault()}
            className={({ isActive }) => {
              const active = isActive || selected;
              return `group relative flex items-center justify-center w-12 h-12 transition-all ${
                active
                  ? 'rounded-xl ring-2 ring-primary bg-primary/20'
                  : 'rounded-2xl hover:rounded-xl hover:bg-primary/20'
              }`;
            }}
          >
            {selected && (
              <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-base-content rounded-r-full" />
            )}
            <div
              className={`w-12 h-12 overflow-hidden transition-all ${
                selected ? 'rounded-xl' : 'rounded-2xl group-hover:rounded-xl'
              }`}
            >
              {c.type === 'course' ? (
                <CourseCommunityAvatar sectionId={c._id} className="w-full h-full" boxPx={48} />
              ) : (
                <img src={communityAvatar(c)} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </NavLink>
        </div>
        {tooltip}
      </>
    );
  };

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

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-1 gap-2 [overflow-anchor:none]"
        style={{ overscrollBehavior: 'contain' }}
      >
        {railCommunities.map((c) => (
          <RailCommunityItem key={c._id} c={c} />
        ))}
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
