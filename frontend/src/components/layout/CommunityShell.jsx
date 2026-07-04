/**
 * CommunityShell — top-level layout wrapper for the /c/* community routes.
 *
 * Renders the three-column layout: CommunityRail (left icon strip) +
 * ChannelSidebar (channel list) + main content via <Outlet />.
 * Also houses the top header bar with "All events", "Add Community",
 * "Messages", "Suggest", and the theme toggle.
 *
 * Used as a parent route element in the router — every community page
 * (chat, posts, events, moderator) is rendered inside this shell.
 */
import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import CommunityRail from './CommunityRail';
import ChannelSidebar from './ChannelSidebar';
import ThemeToggle from '../ThemeToggle';
import RequestModeratorModal from '../RequestModeratorModal';
import { CalendarIcon, PlusIcon, LightbulbIcon, ShieldIcon } from '../icons';
import AddCommunityModal from '../AddCommunityModal';

// localStorage key used to persist the channel sidebar open/closed state
const SIDEBAR_KEY = 'unipulse_channel_sidebar';

export default function CommunityShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { communityId } = useParams();

  // Detect special full-width routes where the sidebar should be hidden
  const isAllEvents = location.pathname === '/c/events' || location.pathname.startsWith('/c/events/');
  const isMessages = location.pathname === '/c/messages' || location.pathname.startsWith('/c/messages/');

  // Whether the channel sidebar panel is visible; persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) !== 'closed'
  );
  // Controls the "Message the moderators" suggestion modal
  const [requestOpen, setRequestOpen] = useState(false);
  // Controls the "Add Community" catalog modal
  const [addOpen, setAddOpen] = useState(false);

  // Auto-collapse sidebar on full-width routes (all-events, messages)
  useEffect(() => {
    if (isAllEvents || isMessages) setSidebarOpen(false);
  }, [isAllEvents, isMessages]);

  // Auto-expand sidebar when a specific community is selected
  useEffect(() => {
    if (communityId && communityId !== 'moderator' && !isAllEvents && !isMessages) {
      setSidebarOpen(true);
    }
  }, [communityId, isAllEvents, isMessages]);

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarOpen ? 'open' : 'closed');
  }, [sidebarOpen]);

  // Navigate to the aggregated events page and hide the sidebar
  const openAllEvents = () => {
    setSidebarOpen(false);
    navigate('/c/events');
  };

  // Navigate to the moderator messages page and hide the sidebar
  const openMessages = () => {
    setSidebarOpen(false);
    navigate('/c/messages');
  };

  return (
    /* Full-screen container — flex column: fixed header + flexible body */
    <div className="h-screen flex flex-col bg-base-300 overflow-hidden">
      {/* ── Top header bar: three-column grid (left actions | center | right actions) ── */}
      <header className="h-10 shrink-0 bg-base-200 border-b border-base-content/10 grid grid-cols-[1fr_auto_1fr] items-center px-3 gap-2">
        {/* Left section — "All events" button */}
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

        {/* Center section — "Add Community" button opens the catalog modal */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-w-[11rem] h-8 px-3 rounded-lg bg-base-300 border border-base-content/15 text-base-content/50 hover:border-base-content/25 hover:bg-base-200/80 transition-colors cursor-pointer"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="w-4 h-4 shrink-0 text-base-content/45" />
          <span className="text-sm">Add Community</span>
        </button>

        {/* Right section — Messages, Suggest, and theme toggle */}
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

      {/* ── Body: rail + optional sidebar + main content area ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left icon rail (community avatars, toggle, profile) */}
        <CommunityRail
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        {/* Channel sidebar — hidden on all-events and messages routes */}
        {sidebarOpen && !isAllEvents && !isMessages && <ChannelSidebar />}
        {/* Main content area — child route renders here via <Outlet /> */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-base-100 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Modals rendered at shell level so they overlay the entire layout */}
      <RequestModeratorModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <AddCommunityModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
