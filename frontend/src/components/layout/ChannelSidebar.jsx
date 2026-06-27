import { NavLink, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CommunityAvatar from '../CommunityAvatar';
import usePinnedCommunities from '../../hooks/usePinnedCommunities';
import { ChatIcon, PostIcon, CalendarIcon, ShieldIcon, PinIcon } from '../icons';

const TABS = [
  { id: 'posts', label: 'Posts', icon: <PostIcon /> },
  { id: 'events', label: 'Events', icon: <CalendarIcon /> },
  { id: 'chat', label: 'Group Chat', icon: <ChatIcon /> },
];

export default function ChannelSidebar() {
  const { communityId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isModeratorRoute = location.pathname === '/c/moderator';
  const user = useSelector((s) => s.auth.user);
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );
  const { togglePin, isPinned } = usePinnedCommunities();
  const pinned = communityId ? isPinned(communityId) : false;
  const isCourse = community?.type === 'course';
  const canUnpin = communityId && !isCourse && pinned;

  const handleUnpin = () => {
    if (!canUnpin) return;
    togglePin(communityId, community);
    const fallback = user?.joinedCommunities?.find((id) => id !== communityId);
    if (communityId && !isCourse) {
      if (fallback) navigate(`/c/${encodeURIComponent(fallback)}/chat`);
      else navigate('/c');
    }
  };

  if (isModeratorRoute) {
    return (
      <aside className="w-60 bg-base-300 flex flex-col min-h-0 border-r border-base-content/10 shrink-0">
        <div className="h-12 px-3 flex items-center border-b border-base-content/10">
          <span className="font-bold text-sm flex items-center gap-2">
            <ShieldIcon className="text-secondary" /> Moderator
          </span>
        </div>
        <nav className="p-2">
          <NavLink to="/c" className="btn btn-ghost btn-sm w-full justify-start rounded-lg">
            ← Back to communities
          </NavLink>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-base-300 flex flex-col min-h-0 border-r border-base-content/10 shrink-0 pt-10">
      <div className="h-12 px-3 flex items-center gap-2 border-b border-base-content/10 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="avatar shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden">
              <CommunityAvatar community={community} className="w-full h-full" boxPx={32} />
            </div>
          </div>
          <span className="font-bold truncate text-sm">{community?.name || communityId}</span>
        </div>
        {canUnpin && (
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square shrink-0 text-primary"
            title="Remove from navbar"
            aria-label={`Remove ${community?.name || communityId} from navbar`}
            onClick={handleUnpin}
          >
            <PinIcon pinned className="text-base" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
        <p className="text-[10px] uppercase font-bold text-base-content/40 px-2 mb-1 tracking-wider">
          Channels
        </p>
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={`/c/${encodeURIComponent(communityId)}/${t.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-base-100 text-base-content shadow-sm'
                  : 'text-base-content/70 hover:bg-base-100/60 hover:text-base-content'
              }`
            }
          >
            <span className="text-base opacity-80">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
        {user?.moderator && (
          <>
            <div className="divider my-1" />
            <NavLink
              to="/c/moderator"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-secondary/20 text-secondary' : 'text-base-content/70 hover:bg-base-100/60'
                }`
              }
            >
              <ShieldIcon /> Moderator
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
