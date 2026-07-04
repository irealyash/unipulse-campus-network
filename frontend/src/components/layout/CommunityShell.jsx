import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import CommunityRail from './CommunityRail';
import ChannelSidebar from './ChannelSidebar';
import ThemeToggle from '../ThemeToggle';
import RequestModeratorModal from '../RequestModeratorModal';
import { CalendarIcon, PlusIcon, LightbulbIcon, ShieldIcon } from '../icons';
import AddCommunityModal from '../AddCommunityModal';

const SIDEBAR_KEY = 'unipulse_channel_sidebar';

export default function CommunityShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { communityId } = useParams();
  const isAllEvents = location.pathname === '/c/events' || location.pathname.startsWith('/c/events/');
  const isMessages = location.pathname === '/c/messages' || location.pathname.startsWith('/c/messages/');

  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) !== 'closed'
  );
  const [requestOpen, setRequestOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (isAllEvents || isMessages) setSidebarOpen(false);
  }, [isAllEvents, isMessages]);

  useEffect(() => {
    if (communityId && communityId !== 'moderator' && !isAllEvents && !isMessages) {
      setSidebarOpen(true);
    }
  }, [communityId, isAllEvents, isMessages]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  const openAllEvents = () => {
    setSidebarOpen(false);
    navigate('/c/events');
  };

  const openMessages = () => {
    setSidebarOpen(false);
    navigate('/c/messages');
  };

  return (
    <div className="h-screen flex flex-col bg-base-300 overflow-hidden">
      <header className="h-10 shrink-0 bg-base-200 border-b border-base-content/10 grid grid-cols-[1fr_auto_1fr] items-center px-3 gap-2">
        <div className="justify-self-start">
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium border transition-all cursor-pointer shadow-sm ${
              isAllEvents
                ? 'bg-primary/15 border-primary/50 text-primary'
                : 'bg-base-300/90 border-base-content/20 text-base-content/75 hover:bg-base-100 hover:border-primary/35 hover:text-base-content hover:shadow-md'
            }`}
            onClick={openAllEvents}
          >
            <CalendarIcon className="text-base shrink-0" /> All events
          </button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-w-[11rem] h-8 px-3 rounded-lg bg-base-300 border border-base-content/15 text-base-content/50 hover:border-base-content/25 hover:bg-base-200/80 transition-colors cursor-pointer"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="w-4 h-4 shrink-0 text-base-content/45" />
          <span className="text-sm">Add Community</span>
        </button>

        <div className="justify-self-end flex items-center gap-2">
          <button
            type="button"
            className={`btn btn-ghost btn-xs gap-1.5 rounded-full cursor-pointer ${
              isMessages ? 'btn-active text-secondary' : 'text-base-content/70 hover:text-base-content'
            }`}
            onClick={openMessages}
          >
            <ShieldIcon className="w-4 h-4 shrink-0 text-secondary" /> Messages
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1.5 rounded-full text-base-content/70 hover:text-base-content"
            onClick={() => setRequestOpen(true)}
          >
            <LightbulbIcon className="w-4 h-4 shrink-0" /> Suggest
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <CommunityRail
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        {sidebarOpen && !isAllEvents && !isMessages && <ChannelSidebar />}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100 overflow-hidden">
          <Outlet />
        </main>
      </div>

      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <AddCommunityModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
