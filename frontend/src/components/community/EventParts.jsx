import { useEffect, useState } from 'react';
import { eventAvatar } from '../../lib/avatars';

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function getEventMediaItems(event) {
  if (event?.media?.length > 0) return event.media;
  if (event?.imageUrl) return [{ url: event.imageUrl, mediaType: 'image' }];
  return [];
}

export function formatEventDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function EventRsvpButtons({ ev, onRsvp }) {
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

export function EventMediaCarousel({ event, compact = false }) {
  const items = getEventMediaItems(event);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [event?._id]);

  const goPrev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const goNext = () => setIndex((i) => (i + 1) % items.length);

  const heightClass = compact ? 'h-48' : 'h-72 sm:h-96';
  const hasMultiple = items.length > 1;
  const current = items[index];

  const renderSlide = (m) =>
    m.mediaType === 'video' ? (
      <video src={m.url} controls className={`w-full ${heightClass} object-contain bg-base-200 rounded-xl`} />
    ) : (
      <img src={m.url} alt="" className={`w-full ${heightClass} object-contain bg-base-200 rounded-xl`} />
    );

  if (!items.length) {
    return (
      <figure className={`${compact ? 'mt-2' : 'mt-4'} ${heightClass} bg-base-200 rounded-xl overflow-hidden`}>
        <img src={eventAvatar(event)} alt="" className="w-full h-full object-cover" />
      </figure>
    );
  }

  return (
    <div className={`relative min-w-0 overflow-hidden ${compact ? 'mt-2' : 'mt-4'}`}>
      <div className="relative flex items-center gap-2 min-w-0">
        {hasMultiple && (
          <button
            type="button"
            className="btn btn-circle shrink-0 bg-neutral text-neutral-content border-0 hover:bg-neutral/90 shadow-lg"
            onClick={goPrev}
            aria-label="Previous media"
          >
            <ChevronLeftIcon />
          </button>
        )}

        <div className={`flex-1 min-w-0 ${!hasMultiple ? 'w-full' : ''}`}>{renderSlide(current)}</div>

        {hasMultiple && (
          <button
            type="button"
            className="btn btn-circle shrink-0 bg-neutral text-neutral-content border-0 hover:bg-neutral/90 shadow-lg"
            onClick={goNext}
            aria-label="Next media"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>

      {hasMultiple && (
        <p className="text-center text-xs text-base-content/50 mt-2">
          {index + 1} / {items.length}
        </p>
      )}
    </div>
  );
}

export function EventMediaGallery(props) {
  return <EventMediaCarousel {...props} />;
}

/** Build an ISO datetime from date + 12-hour clock fields. */
export function buildEventDateTime(dateStr, hour12, minute, ampm) {
  if (!dateStr) return null;
  let h = parseInt(hour12, 10);
  if (Number.isNaN(h) || h < 1 || h > 12) return null;
  const m = parseInt(minute, 10);
  if (Number.isNaN(m) || m < 0 || m > 59) return null;
  h = h % 12;
  if (ampm === 'PM') h += 12;
  const isoLocal = `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  const d = new Date(isoLocal);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayDateInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
