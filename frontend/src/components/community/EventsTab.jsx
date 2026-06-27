import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchEvents, createEvent, rsvpEvent } from '../../features/events/eventsSlice';
import { eventAvatar } from '../../lib/avatars';
import { uploadMedia } from '../../lib/media';
import Loader from '../Loader';
import { CalendarIcon } from '../icons';
import ReportModal from '../chat/ReportModal';
import ReportFlagButton from '../ReportFlagButton';
import {
  buildEventDateTime,
  EventMediaGallery,
  EventRsvpButtons,
  formatEventDate,
  todayDateInputValue,
} from './EventParts';

const DESC_CLAMP = 160;

/** Events tab — full-width cards, route-based detail view, RSVP, sort, multi-media. */
export default function EventsTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );
  const bucket = useSelector((s) => s.events.byCommunity[communityId]);

  const [sort, setSort] = useState('date');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventDate: todayDateInputValue(),
    eventHour: '6',
    eventMinute: '00',
    eventAmPm: 'PM',
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [formError, setFormError] = useState('');
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchEvents({ communityId, sort }));
  }, [dispatch, communityId, sort]);

  const events = bucket?.events || [];
  const loading = bucket?.status === 'loading';

  const eventPath = (id) => `/c/${encodeURIComponent(communityId)}/events/${id}`;

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      eventDate: todayDateInputValue(),
      eventHour: '6',
      eventMinute: '00',
      eventAmPm: 'PM',
    });
    setMediaFiles([]);
    setFormError('');
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    setFormError('');

    const when = buildEventDateTime(
      form.eventDate,
      form.eventHour,
      form.eventMinute,
      form.eventAmPm
    );
    if (!when) {
      setFormError('Please enter a valid date and time.');
      return;
    }
    if (when.getTime() <= Date.now()) {
      setFormError('Event date and time must be after the current moment.');
      return;
    }

    const media = [];
    for (const file of mediaFiles) {
      media.push(await uploadMedia(file));
    }

    await dispatch(
      createEvent({
        communityId,
        payload: {
          title: form.title,
          description: form.description,
          eventDate: when.toISOString(),
          media,
          imageUrl: media[0]?.url,
        },
      })
    );
    setCreateOpen(false);
    resetForm();
    dispatch(fetchEvents({ communityId, sort }));
  };

  const handleRsvp = (eventId, status) => {
    dispatch(rsvpEvent({ eventId, status }));
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-bold text-lg">Events</h1>
          <p className="text-xs text-base-content/50">{community?.name}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div role="tablist" className="tabs tabs-box tabs-sm">
            <button
              type="button"
              role="tab"
              className={`tab ${sort === 'date' ? 'tab-active' : ''}`}
              onClick={() => setSort('date')}
            >
              Soonest
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${sort === 'rsvp' ? 'tab-active' : ''}`}
              onClick={() => setSort('rsvp')}
            >
              Most Attending
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm rounded-full" onClick={() => setCreateOpen(true)}>
            + New event
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200/30 min-h-0">
        {loading && <Loader label="Loading events…" />}
        {!loading && events.length === 0 && (
          <div className="card bg-base-100 border border-dashed border-base-300">
            <div className="card-body items-center text-center text-base-content/50 py-12">
              <CalendarIcon className="text-4xl text-primary opacity-50" />
              <p className="mt-2">No upcoming events.</p>
            </div>
          </div>
        )}

        {events.map((ev) => {
          const longDesc = (ev.description?.length || 0) > DESC_CLAMP;
          const preview = longDesc
            ? `${ev.description.slice(0, DESC_CLAMP).trim()}…`
            : ev.description;

          return (
            <article
              key={ev._id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="card-body p-0 flex-row gap-0">
                <Link
                  to={eventPath(ev._id)}
                  className="shrink-0 w-36 sm:w-44 h-32 sm:h-36 bg-base-200 overflow-hidden block"
                >
                  <img src={eventAvatar(ev)} alt="" className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 py-3 pr-4 pl-3 min-w-0 relative">
                  <p className="text-xs text-base-content/50 flex flex-wrap items-center gap-1">
                    {formatEventDate(ev.eventDate)}
                    <ReportFlagButton
                      onClick={() => setReportTarget({ contentType: 'event', contentId: ev._id })}
                    />
                  </p>
                  <Link
                    to={eventPath(ev._id)}
                    className="font-bold text-base mt-1 link link-hover text-left block line-clamp-2"
                  >
                    {ev.title}
                  </Link>
                  {preview && (
                    <p className="text-sm text-base-content/80 line-clamp-3 mt-1">{preview}</p>
                  )}
                  <div className="badge badge-success badge-outline gap-1 w-fit mt-2">
                    {ev.comingCount ?? 0} coming
                  </div>
                  <EventRsvpButtons ev={ev} onRsvp={handleRsvp} />
                  <Link
                    to={eventPath(ev._id)}
                    className="text-xs text-primary mt-2 link link-hover inline-block"
                  >
                    View more details
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {createOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg">
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
              <div>
                <label className="label py-0">
                  <span className="label-text text-xs">Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered rounded-2xl w-full"
                  required
                  min={todayDateInputValue()}
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="label py-0">
                    <span className="label-text text-xs">Time</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="select select-bordered rounded-2xl flex-1"
                      required
                      value={form.eventHour}
                      onChange={(e) => setForm({ ...form, eventHour: e.target.value })}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={String(h)}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      className="select select-bordered rounded-2xl w-20"
                      required
                      value={form.eventMinute}
                      onChange={(e) => setForm({ ...form, eventMinute: e.target.value })}
                    >
                      {['00', '15', '30', '45'].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="select select-bordered rounded-2xl w-24"
                      required
                      value={form.eventAmPm}
                      onChange={(e) => setForm({ ...form, eventAmPm: e.target.value })}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="label py-0">
                  <span className="label-text text-xs">Photos & videos (optional, multiple)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="file-input file-input-bordered rounded-2xl w-full"
                  onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
                />
                {mediaFiles.length > 0 && (
                  <p className="text-xs text-base-content/50 mt-1">{mediaFiles.length} file(s) selected</p>
                )}
              </div>
              {formError && <p className="text-error text-sm">{formError}</p>}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost rounded-2xl"
                  onClick={() => {
                    setCreateOpen(false);
                    resetForm();
                  }}
                >
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

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
