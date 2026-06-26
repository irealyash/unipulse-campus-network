import { NavLink, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { communityAvatar } from '../../lib/avatars';
import { ChatIcon, PostIcon, CalendarIcon } from '../icons';

const TABS = [
  { id: 'posts', label: 'Posts', icon: <PostIcon /> },
  { id: 'events', label: 'Events', icon: <CalendarIcon /> },
  { id: 'chat', label: 'Group Chat', icon: <ChatIcon /> },
];

/**
 * Second vertical sidebar (Discord-style channel list) with Posts, Events, Chat.
 * Collapsible via `onToggle` from the parent shell.
 */
export default function ChannelSidebar({ open, onToggle }) {
  const { communityId } = useParams();
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );

  if (!open) {
    return (
      <div className="w-10 bg-base-300 flex flex-col items-center py-3 border-r border-base-content/10">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square"
          onClick={onToggle}
          title="Open channels"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <aside className="w-60 bg-base-300 flex flex-col min-h-0 border-r border-base-content/10">
      {/* Community header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-base-content/10 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="avatar">
            <div className="w-8 rounded-xl">
              <img src={communityAvatar(community)} alt="" />
            </div>
          </div>
          <span className="font-bold truncate text-sm">{community?.name || communityId}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onToggle} title="Hide">
          ←
        </button>
      </div>

      {/* Channel tabs */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
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
      </nav>
    </aside>
  );
}
