/**
 * EventsFeed — shared events list view used in two modes:
 * - "community" — events for a single community (used by EventsTab)
 * - "all"       — aggregated public events across all communities (used by AllEventsPage)
 *
 * Features: tag filtering, date/popularity sorting, event creation modal
 * with date/time picker and capacity controls, RSVP buttons, media carousel,
 * and report functionality.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchEvents,
  fetchAllPublicEvents,
  createEvent,
  rsvpEvent,
  showEventNotice,
  ALL_PUBLIC_EVENTS_KEY,
} from '../../features/events/eventsSlice';
import { timeAgo } from '../../lib/timeAgo';
import { EventTagBadge, EVENT_FEED_TAG_FILTERS } from '../../lib/eventTags';
import { uploadMedia } from '../../lib/media';
import Loader from '../Loader';
import { CalendarIcon, ChevronIcon } from '../icons';
import ReportModal from '../chat/ReportModal';
import ReportFlagButton from '../ReportFlagButton';
import {
  buildEventDateTime,
  EventMediaCarousel,
  EventRsvpButtons,
  formatEventDate,
  hasEventUserMedia,
  todayDateInputValue,
} from './EventParts';

// Shared Tailwind classes for segmented control buttons
const SEGMENT_BTN =
  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer';
const SEGMENT_ACTIVE = 'bg-base-100 text-base-content shadow-sm';
const SEGMENT_IDLE = 'text-base-content/60 hover:text-base-content';

/**
 * EventTagFilter — dropdown filter button for event tags (e.g. "Academic",
 * "Social"). Renders as a portal menu so it stacks above all content.
 */
function EventTagFilter({ value, onChange }) {
  // Whether the dropdown is open
  const [open, setOpen] = useState(false);
  // Absolute position for the portal menu
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const label = value === 'all' ? 'Tag' : value;
  const options = [{ value: 'all', label: 'Tag' }, ...EVENT_FEED_TAG_FILTERS.map((t) => ({ value: t, label: t }))];

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
  };

  // Close on outside click / scroll; keep position in sync on resize
  useEffect(() => {
    if (!open) return;
    updatePosition();

    const onPointerDown = (e) => {
      const target = e.target;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  const menu = open
    ? createPortal(
        <ul
          ref={menuRef}
          role="listbox"
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-[9999] min-w-[8.5rem] rounded-lg bg-base-200 p-1 shadow-xl border border-base-content/10"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={`w-full text-left ${SEGMENT_BTN} ${
                  value === opt.value ? SEGMENT_ACTIVE : SEGMENT_IDLE
                }`}
                onClick={() => pick(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`inline-flex items-center gap-1.5 ${SEGMENT_BTN} ${
          value !== 'all' || open ? SEGMENT_ACTIVE : SEGMENT_IDLE
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {label}
        <ChevronIcon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>
      {menu}
    </>
  );
}

/**
 * Shared events feed — community tab or all public communities.
 * @param {object} props
 * @param {'community'|'all'} props.mode
 * @param {string} [props.communityId]
 * @param {string} [props.subtitle]
 * @param {boolean} [props.showCreate]
 * @param {boolean} [props.showCommunityName]
 */
/**
 * @param {'community'|'all'} mode — single community vs all public events
 * @param {string} [communityId]   — required when mode is 'community'
 * @param {string} [subtitle]      — shown below the heading
 * @param {boolean} [showCreate]   — whether to show the "New event" button
 * @param {boolean} [showCommunityName] — badge each event with its community name
 */
export default function EventsFeed({
  mode = 'community',
  communityId,
  subtitle = '',
  showCreate = false,
  showCommunityName = false,
}) {
  const dispatch = useDispatch();
  // Use a special key for the all-events bucket in Redux
  const bucketKey = mode === 'all' ? ALL_PUBLIC_EVENTS_KEY : communityId;
  const bucket = useSelector((s) => s.events.byCommunity[bucketKey]);

  // Sort mode: "date" (upcoming first) or "rsvp" (most popular)
  const [sort, setSort] = useState('date');
  // Active tag filter value ("all" = show everything)
  const [tagFilter, setTagFilter] = useState('all');
  // Whether the event creation modal is open
  const [createOpen, setCreateOpen] = useState(false);
  // Form state for the "Create event" modal
  const [form, setForm] = useState({
    title: '',
    description: '',
    moderatorNote: '',
    eventDate: todayDateInputValue(),
    eventHour: '6',
    eventMinute: '00',
    eventAmPm: 'PM',
    noCapacityLimit: true,
    capacity: '',
  });
  // Selected media files for the new event
  const [mediaFiles, setMediaFiles] = useState([]);
  // Validation error shown in the create modal
  const [formError, setFormError] = useState('');
  // Report modal target { contentType, contentId }
  const [reportTarget, setReportTarget] = useState(null);

  // Fetch events whenever mode/community/sort/tag changes
  useEffect(() => {
    if (mode === 'all') {
      dispatch(fetchAllPublicEvents({ sort, tag: tagFilter }));
    } else if (communityId) {
      dispatch(fetchEvents({ communityId, sort, tag: tagFilter }));
    }
  }, [dispatch, mode, communityId, sort, tagFilter]);

  const events = bucket?.events || [];
  const loading = bucket?.status === 'loading';

  // Build the link path for an event detail page
  const eventPath = (ev) =>
    mode === 'all'
      ? `/c/events/${ev._id}`
      : `/c/${encodeURIComponent(ev.communityId)}/events/${ev._id}`;

  // Reset the create-event form to defaults
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      moderatorNote: '',
      eventDate: todayDateInputValue(),
      eventHour: '6',
      eventMinute: '00',
      eventAmPm: 'PM',
      noCapacityLimit: true,
      capacity: '',
    });
    setMediaFiles([]);
    setFormError('');
  };

  // Validate and submit a new event for moderator review
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
    if (!form.noCapacityLimit) {
      const cap = parseInt(form.capacity, 10);
      if (!Number.isFinite(cap) || cap < 1) {
        setFormError('Enter a valid capacity (at least 1), or choose no limit.');
        return;
      }
    }

    const payload = {
      title: form.title,
      description: form.description,
      moderatorNote: form.moderatorNote,
      eventDate: when.toISOString(),
      unlimitedCapacity: form.noCapacityLimit,
      ...(form.noCapacityLimit ? {} : { capacity: parseInt(form.capacity, 10) }),
    };
    const files = [...mediaFiles];

    setCreateOpen(false);
    resetForm();
    dispatch(showEventNotice('Your event has been submitted for moderator approval.'));

    try {
      const media = [];
      for (const file of files) {
        media.push(await uploadMedia(file));
      }
      await dispatch(
        createEvent({
          communityId,
          payload: {
            ...payload,
            media,
            imageUrl: media[0]?.url,
          },
        })
      ).unwrap();
    } catch (err) {
      dispatch(showEventNotice(err?.message || 'Could not submit your event. Please try again.'));
    }
  };

  // Dispatch RSVP action (attend / busy / cancel)
  const handleRsvp = (eventId, status, previousRsvp) => {
    dispatch(rsvpEvent({ eventId, status, previousRsvp }));
  };

  const title = mode === 'all' ? 'All events' : 'Events';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-base-content/50 leading-tight mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <div className="inline-flex flex-row items-center shrink-0 rounded-lg bg-base-200 p-1 gap-0.5">
            <EventTagFilter value={tagFilter} onChange={setTagFilter} />
            <button
              type="button"
              className={`${SEGMENT_BTN} ${sort === 'date' ? SEGMENT_ACTIVE : SEGMENT_IDLE}`}
              onClick={() => setSort('date')}
            >
              Upcoming
            </button>
            <button
              type="button"
              className={`${SEGMENT_BTN} ${sort === 'rsvp' ? SEGMENT_ACTIVE : SEGMENT_IDLE}`}
              onClick={() => setSort('rsvp')}
            >
              Popular
            </button>
          </div>
          {showCreate && (
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-full"
              onClick={() => setCreateOpen(true)}
            >
              + New event
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-base-200/30 min-h-0">
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
          const hasMedia = hasEventUserMedia(ev);

          return (
            <article
              key={ev._id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="card-body py-3 px-4 min-w-0 overflow-hidden">
                <p className="text-xs text-base-content/50 flex flex-wrap items-center gap-1">
                  {showCommunityName && (
                    <span className="badge badge-ghost badge-xs">{ev.communityName || ev.communityId}</span>
                  )}
                  {formatEventDate(ev.eventDate)} · {timeAgo(ev.createdAt)}
                  <EventTagBadge tag={ev.tag} />
                  <ReportFlagButton
                    onClick={() => setReportTarget({ contentType: 'event', contentId: ev._id })}
                  />
                </p>
                <Link
                  to={eventPath(ev)}
                  className="font-bold text-base mt-1 link link-hover text-left block line-clamp-2 break-words [overflow-wrap:anywhere]"
                >
                  {ev.title}
                </Link>
                {!hasMedia && ev.description && (
                  <p className="text-sm text-base-content/80 line-clamp-3 mt-1 break-words [overflow-wrap:anywhere]">
                    {ev.description}
                  </p>
                )}
                {hasMedia && <EventMediaCarousel event={ev} feed />}
                <EventRsvpButtons ev={ev} onRsvp={handleRsvp} />
                <Link
                  to={eventPath(ev)}
                  className="text-xs text-primary mt-2 link link-hover inline-block"
                >
                  View more details
                </Link>
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
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
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
                  <span className="label-text text-xs">Capacity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary rounded"
                    checked={form.noCapacityLimit}
                    onChange={(e) =>
                      setForm({ ...form, noCapacityLimit: e.target.checked, capacity: '' })
                    }
                  />
                  <span className="text-sm text-base-content/80">No limit — open to all students</span>
                </label>
                {!form.noCapacityLimit && (
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered rounded-2xl w-full input-no-spin"
                    placeholder="Maximum number of attendees"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    required
                  />
                )}
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
              <label className="form-control">
                <span className="label py-0">
                  <span className="label-text text-xs">
                    Information for moderator (Not visible to others)
                  </span>
                </span>
                <textarea
                  className="textarea textarea-bordered rounded-2xl text-sm"
                  placeholder="Optional context for the review team"
                  rows={3}
                  value={form.moderatorNote}
                  onChange={(e) => setForm({ ...form, moderatorNote: e.target.value })}
                />
              </label>
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
