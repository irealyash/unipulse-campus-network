/**
 * EventPage.jsx
 *
 * Full-page view for a single event.
 * Route: "/c/:communityId/events/:eventId" or "/c/events/:eventId"
 * Role: Fetches and displays a single event's details including title,
 * date, description, media carousel, RSVP buttons, and moderation status
 * banners. Also provides a report button. The back link adapts based on
 * whether the user came from the all-events feed or a specific community.
 */

import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvent, rsvpEvent, clearCurrentEvent } from '../features/events/eventsSlice';
import Loader from '../components/Loader';
import { timeAgo } from '../lib/timeAgo';
import { EventTagBadge } from '../lib/eventTags';
import ReportModal from '../components/chat/ReportModal';
import ReportFlagButton from '../components/ReportFlagButton';
import {
  EventMediaCarousel,
  EventRsvpButtons,
  formatEventDate,
  hasEventUserMedia,
} from '../components/community/EventParts';

/** Full-page view for a single event (no likes or comments). */
export default function EventPage() {
  // Extract community and event IDs from URL params
  const { communityId, eventId } = useParams();
  const location = useLocation();
  // Determine whether the user arrived from the all-events feed (affects back link)
  const fromAllEvents = location.pathname.startsWith('/c/events/');
  const dispatch = useDispatch();

  // Reads the currently loaded event from Redux state
  const event = useSelector((s) => s.events.currentEvent);
  // Local state for the report modal
  const [reportTarget, setReportTarget] = useState(null);

  /**
   * useEffect: Fetches the event details when the component mounts or eventId changes.
   * Clears the current event from Redux on unmount to prevent stale data.
   */
  useEffect(() => {
    dispatch(fetchEvent(eventId));
    return () => dispatch(clearCurrentEvent());
  }, [dispatch, eventId]);

  /**
   * Handler: RSVP to the event.
   * Triggered when the user clicks Going/Interested/Not Going buttons.
   * Dispatches the rsvpEvent thunk with the new status and the previous RSVP.
   */
  const handleRsvp = (id, status, previousRsvp) => {
    dispatch(rsvpEvent({ eventId: id, status, previousRsvp }));
  };

  // Loading state — show spinner until the correct event is loaded
  if (!event || event._id !== eventId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader label="Loading event…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar — back navigation (adapts to context) */}
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3">
        <Link
          to={fromAllEvents ? '/c/events' : `/c/${encodeURIComponent(communityId)}/events`}
          className="text-sm text-primary link link-hover"
        >
          {fromAllEvents ? '← Back to all events' : '← Back to events'}
        </Link>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-base-200/30 min-h-0">
        <article className="card bg-base-100 border border-base-200 shadow-sm max-w-3xl mx-auto w-full min-w-0 overflow-hidden">
          <div className="card-body min-w-0 overflow-hidden">
            {/* Moderation status banners */}
            {event.status === 'pending' && (
              <div className="alert alert-warning text-sm py-2 mb-2">
                This event is awaiting moderator approval.
              </div>
            )}
            {event.status === 'rejected' && (
              <div className="alert alert-error text-sm py-2 mb-2">
                This event was rejected by a moderator.
              </div>
            )}

            {/* Event title and report button */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <h1 className="font-bold text-2xl min-w-0 flex-1 break-words">{event.title}</h1>
              <ReportFlagButton
                onClick={() => setReportTarget({ contentType: 'event', contentId: event._id })}
              />
            </div>

            {/* Media carousel — shown if the event has user-uploaded images */}
            {hasEventUserMedia(event) && <EventMediaCarousel event={event} />}

            {/* Event metadata — date, relative time, and tag badge */}
            <div className="mt-4 space-y-3 min-w-0 overflow-hidden">
              <p className="text-sm text-base-content/60 break-words flex flex-wrap items-center gap-2">
                <span>
                  {formatEventDate(event.eventDate)} · {timeAgo(event.createdAt)}
                </span>
                <EventTagBadge tag={event.tag} />
              </p>
              {/* Event description */}
              {event.description && (
                <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base-content/80">
                  {event.description}
                </p>
              )}
            </div>

            {/* RSVP buttons section — Going / Interested / Not Going */}
            <div className="mt-6 pt-4 border-t border-base-200">
              <EventRsvpButtons ev={event} onRsvp={handleRsvp} />
            </div>
          </div>
        </article>
      </div>

      {/* Report modal */}
      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
