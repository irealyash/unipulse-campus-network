import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchEvents, createEvent, rsvpEvent } from '../../features/events/eventsSlice';
import { eventAvatar } from '../../lib/avatars';
import { uploadMedia } from '../../lib/media';
import Loader from '../Loader';
import { CalendarIcon, CloseIcon } from '../icons';
import ReportModal from '../chat/ReportModal';
import ReportFlagButton from '../ReportFlagButton';

const TITLE_CLAMP = 48;
const DESC_CLAMP = 100;

function formatEventDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventNeedsDetails(ev) {
  return (ev.title?.length || 0) > TITLE_CLAMP || (ev.description?.length || 0) > DESC_CLAMP;
}

function EventRsvpButtons({ ev, onRsvp }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <button
        type="button"
        className={`btn btn-sm rounded-full ${
          ev.myRsvp === 'coming' ? 'btn-success' : 'btn-outline btn-success'
        }`}
        onClick={() => onRsvp(ev._id, ev.myRsvp === 'coming' ? 'none' : 'coming')}
      >
        I will come
      </button>
      <button
        type="button"
        className={`btn btn-sm rounded-full ${
          ev.myRsvp === 'busy' ? 'btn-error' : 'btn-outline btn-error'
        }`}
        onClick={() => onRsvp(ev._id, ev.myRsvp === 'busy' ? 'none' : 'busy')}
      >
        I am busy
      </button>
    </div>
  );
}

function EventDetailModal({ event, onClose, onRsvp }) {
  if (!event) return null;

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box rounded-3xl max-w-lg w-11/12 max-h-[90vh] overflow-y-auto p-0">
        <figure className="h-52 bg-base-200 shrink-0">
          <img src={eventAvatar(event)} alt="" className="w-full h-full object-cover" />
        </figure>
        <div className="p-6">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-xl pr-2">{event.title}</h3>
            <button type="button" className="btn btn-ghost btn-sm btn-circle shrink-0" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <p className="text-sm text-base-content/50 mt-2">{formatEventDate(event.eventDate)}</p>
          {event.description && (
            <p className="text-sm text-base-content/80 mt-4 whitespace-pre-wrap">{event.description}</p>
          )}
          <div className="badge badge-success badge-outline gap-1 w-fit mt-4">
            {event.comingCount ?? 0} coming
          </div>
          <EventRsvpButtons ev={event} onRsvp={onRsvp} />
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}

/** Events tab with cover images, RSVP, reports, and expandable details. */
export default function EventsTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const bucket = useSelector((s) => s.events.byCommunity[communityId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '' });
  const [imageFile, setImageFile] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchEvents({ communityId }));
  }, [dispatch, communityId]);

  const events = bucket?.events || [];
  const loading = bucket?.status === 'loading';

  const submitEvent = async (e) => {
    e.preventDefault();
    let imageUrl;
    if (imageFile) {
      const uploaded = await uploadMedia(imageFile);
      imageUrl = uploaded.url;
    }
    await dispatch(
      createEvent({
        communityId,
        payload: {
          title: form.title,
          description: form.description,
          eventDate: new Date(form.eventDate).toISOString(),
          imageUrl,
        },
      })
    );
    setCreateOpen(false);
    setForm({ title: '', description: '', eventDate: '' });
    setImageFile(null);
    dispatch(fetchEvents({ communityId }));
  };

  const handleRsvp = (eventId, status) => {
    dispatch(rsvpEvent({ eventId, status }));
  };

  useEffect(() => {
    if (detailEvent) {
      const updated = events.find((e) => e._id === detailEvent._id);
      if (updated) setDetailEvent(updated);
    }
  }, [events, detailEvent?._id]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 px-4 py-3 flex items-center justify-between bg-base-100">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-primary text-xl" />
          <h1 className="font-bold text-lg">Events</h1>
        </div>
        <button type="button" className="btn btn-primary btn-sm rounded-full" onClick={() => setCreateOpen(true)}>
          + New event
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-base-200/30 min-h-0">
        {loading && <Loader label="Loading events…" />}
        {!loading && events.length === 0 && (
          <div className="card bg-base-100 border border-dashed border-base-300">
            <div className="card-body items-center text-center text-base-content/50 py-12">
              <CalendarIcon className="text-4xl text-primary opacity-50" />
              <p className="mt-2">No upcoming events.</p>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <div key={ev._id} className="card bg-base-100 border border-base-200 shadow-md overflow-hidden">
              <figure className="h-36 bg-base-200">
                <img src={eventAvatar(ev)} alt="" className="w-full h-full object-cover" />
              </figure>
              <div className="card-body p-4 gap-2 relative min-h-[10rem] pb-12">
                <h2 className="card-title text-base line-clamp-2 leading-snug">{ev.title}</h2>
                <p className="text-xs text-base-content/50">{formatEventDate(ev.eventDate)}</p>
                {ev.description && (
                  <p className="text-sm text-base-content/70 line-clamp-3">{ev.description}</p>
                )}
                {eventNeedsDetails(ev) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-primary justify-start px-0 min-h-0 h-auto font-medium"
                    onClick={() => setDetailEvent(ev)}
                  >
                    View more details
                  </button>
                )}

                <div className="badge badge-success badge-outline gap-1 w-fit">
                  {ev.comingCount ?? 0} coming
                </div>

                <EventRsvpButtons ev={ev} onRsvp={handleRsvp} />

                <div className="absolute bottom-3 right-3">
                  <ReportFlagButton
                    onClick={() => setReportTarget({ contentType: 'event', contentId: ev._id })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {createOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl">
            <h3 className="font-bold text-lg">Create event</h3>
            <p className="text-xs text-base-content/50 mt-1">
              Events are reviewed by a moderator before they appear in the list.
            </p>
            <form onSubmit={submitEvent} className="flex flex-col gap-3 mt-3">
              <input
                className="input input-bordered rounded-2xl"
                placeholder="Event title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered rounded-2xl"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="datetime-local"
                className="input input-bordered rounded-2xl"
                required
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered rounded-2xl w-full"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <div className="modal-action">
                <button type="button" className="btn btn-ghost rounded-2xl" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Submit for review
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setCreateOpen(false)} />
        </div>
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onRsvp={handleRsvp}
        />
      )}

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
