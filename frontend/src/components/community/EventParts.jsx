import { useEffect, useState } from 'react';

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

export function hasEventUserMedia(event) {
  return Array.isArray(event?.media) && event.media.length > 0;
}

export function getEventMediaItems(event) {
  if (hasEventUserMedia(event)) return event.media;
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
        onClick={() => onRsvp(ev._id, ev.myRsvp === 'coming' ? 'none' : 'coming', ev.myRsvp)}
      >
        I will come
      </button>
      <button
        type="button"
        className={`btn btn-sm rounded-full ${
          ev.myRsvp === 'busy' ? 'btn-error' : 'btn-outline btn-error'
        }`}
        onClick={() => onRsvp(ev._id, ev.myRsvp === 'busy' ? 'none' : 'busy', ev.myRsvp)}
      >
        I am busy
      </button>
    </div>
  );
}

export function EventMediaCarousel({
  event,
  items: itemsProp,
  fallbackImage,
  compact = false,
  feed = false,
}) {
  const items = itemsProp ?? getEventMediaItems(event);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [event?._id, items.length]);

  const goPrev = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIndex((i) => (i - 1 + items.length) % items.length);
  };
  const goNext = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIndex((i) => (i + 1) % items.length);
  };

  const heightClass = compact ? 'h-48' : 'h-72 sm:h-96';
  const hasMultiple = items.length > 1;
  const current = items[index];

  const renderSlide = (m) => {
    if (feed) {
      const fitClass = 'max-h-52 max-w-full object-contain rounded-xl';
      return m.mediaType === 'video' ? (
        <video src={m.url} controls className={fitClass} />
      ) : (
        <img src={m.url} alt="" className={fitClass} />
      );
    }
    return m.mediaType === 'video' ? (
      <video src={m.url} controls className={`w-full ${heightClass} object-contain bg-base-200 rounded-xl`} />
    ) : (
      <img src={m.url} alt="" className={`w-full ${heightClass} object-contain bg-base-200 rounded-xl`} />
    );
  };

  const slideWrapClass = feed
    ? 'flex-1 min-w-0 flex items-center justify-center min-h-[8rem] max-h-52 bg-base-200 rounded-xl px-2'
    : `flex-1 min-w-0 ${!hasMultiple ? 'w-full' : ''}`;

  if (!items.length) {
    if (!fallbackImage) return null;
    return (
      <figure className={`${compact || feed ? 'mt-2' : 'mt-4'} ${heightClass} bg-base-200 rounded-xl overflow-hidden`}>
        <img src={fallbackImage} alt="" className="w-full h-full object-cover" />
      </figure>
    );
  }

  return (
    <div className={`relative min-w-0 overflow-hidden ${compact || feed ? 'mt-2' : 'mt-4'}`}>
      <div className="relative flex items-center gap-2 min-w-0">
        {hasMultiple && (
          <button
            type="button"
            className="btn btn-circle btn-sm shrink-0 bg-neutral text-neutral-content border-0 hover:bg-neutral/90 shadow-lg"
            onClick={goPrev}
            aria-label="Previous media"
          >
            <ChevronLeftIcon />
          </button>
        )}

        <div className={slideWrapClass}>{renderSlide(current)}</div>

        {hasMultiple && (
          <button
            type="button"
            className="btn btn-circle btn-sm shrink-0 bg-neutral text-neutral-content border-0 hover:bg-neutral/90 shadow-lg"
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
