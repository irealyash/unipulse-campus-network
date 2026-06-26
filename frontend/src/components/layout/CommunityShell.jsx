import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CommunityRail from './CommunityRail';
import ChannelSidebar from './ChannelSidebar';
import ThemeToggle from '../ThemeToggle';
import RequestModeratorModal from '../RequestModeratorModal';
import { InboxIcon } from '../icons';

const SIDEBAR_KEY = 'unipulse_channel_sidebar';

/**
 * Discord-inspired shell: community rail (left) + channel sidebar + main pane.
 */
export default function CommunityShell() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) !== 'closed'
  );
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  return (
    <div className="h-screen flex flex-col bg-base-300 overflow-hidden">
      {/* Thin top utility bar */}
      <header className="h-10 shrink-0 bg-base-200 border-b border-base-content/10 flex items-center justify-end px-3 gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-xs gap-1 rounded-full"
          onClick={() => setRequestOpen(true)}
        >
          <InboxIcon /> Suggest
        </button>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 min-h-0">
        <CommunityRail />
        <ChannelSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100">
          <Outlet />
        </main>
      </div>

      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
