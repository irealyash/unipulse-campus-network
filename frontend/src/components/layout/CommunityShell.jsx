import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import CommunityRail from './CommunityRail';
import ChannelSidebar from './ChannelSidebar';
import ThemeToggle from '../ThemeToggle';
import RequestModeratorModal from '../RequestModeratorModal';
import { InboxIcon, MenuIcon } from '../icons';

const SIDEBAR_KEY = 'unipulse_channel_sidebar';

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

      <div className="flex flex-1 min-h-0 relative">
        <CommunityRail />

        {/* Hamburger toggle — top of channel sidebar, right of community rail */}
        <button
          type="button"
          className="absolute top-2 left-[72px] z-40 btn btn-circle btn-sm bg-base-300 border border-base-content/10 shadow-sm"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? 'Hide channels' : 'Show channels'}
          aria-label="Toggle channel sidebar"
        >
          <MenuIcon />
        </button>

        {sidebarOpen && <ChannelSidebar />}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
