import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import CommunityRail from './CommunityRail';
import ChannelSidebar from './ChannelSidebar';
import ThemeToggle from '../ThemeToggle';
import RequestModeratorModal from '../RequestModeratorModal';
import { InboxIcon, CalendarIcon } from '../icons';

const SIDEBAR_KEY = 'unipulse_channel_sidebar';

export default function CommunityShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAllEvents = location.pathname === '/c/events';

  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) !== 'closed'
  );
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (isAllEvents) setSidebarOpen(false);
  }, [isAllEvents]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  const openAllEvents = () => {
    setSidebarOpen(false);
    navigate('/c/events');
  };

  return (
    <div className="h-screen flex flex-col bg-base-300 overflow-hidden">
      <header className="h-10 shrink-0 bg-base-200 border-b border-base-content/10 flex items-center justify-between px-3 gap-2">
        <button
          type="button"
          className={`btn btn-ghost btn-xs gap-1 rounded-full ${isAllEvents ? 'btn-active' : ''}`}
          onClick={openAllEvents}
        >
          <CalendarIcon /> All events
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 rounded-full"
            onClick={() => setRequestOpen(true)}
          >
            <InboxIcon /> Suggest
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <CommunityRail
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        {sidebarOpen && !isAllEvents && <ChannelSidebar />}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}
