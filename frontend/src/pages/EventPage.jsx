import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvent, rsvpEvent, clearCurrentEvent } from '../features/events/eventsSlice';
import Loader from '../components/Loader';
import { timeAgo } from '../lib/timeAgo';
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
  const { communityId, eventId } = useParams();
  const dispatch = useDispatch();
  const event = useSelector((s) => s.events.currentEvent);
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchEvent(eventId));
    return () => dispatch(clearCurrentEvent());
  }, [dispatch, eventId]);

  const handleRsvp = (id, status) => {
    dispatch(rsvpEvent({ eventId: id, status }));
  };

  if (!event || event._id !== eventId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader label="Loading event…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3">
        <Link
          to={`/c/${encodeURIComponent(communityId)}/events`}
          className="text-sm text-primary link link-hover"
        >
          ← Back to events
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-base-200/30 min-h-0">
        <article className="card bg-base-100 border border-base-200 shadow-sm max-w-3xl mx-auto w-full min-w-0 overflow-hidden">
          <div className="card-body min-w-0 overflow-hidden">
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

            <div className="flex items-start justify-between gap-2 min-w-0">
              <h1 className="font-bold text-2xl min-w-0 flex-1 break-words">{event.title}</h1>
              <ReportFlagButton
                onClick={() => setReportTarget({ contentType: 'event', contentId: event._id })}
              />
            </div>

            {hasEventUserMedia(event) && <EventMediaCarousel event={event} />}

            <div className="mt-4 space-y-3 min-w-0 overflow-hidden">
              <p className="text-sm text-base-content/60 break-words">
                {formatEventDate(event.eventDate)} · {timeAgo(event.createdAt)}
              </p>
              {event.description && (
                <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base-content/80">
                  {event.description}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-base-200">
              <div className="badge badge-success badge-outline gap-1 w-fit">
                {event.comingCount ?? 0} coming
              </div>
              <EventRsvpButtons ev={event} onRsvp={handleRsvp} />
            </div>
          </div>
        </article>
      </div>

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
