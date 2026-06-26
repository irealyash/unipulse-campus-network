import { useEffect, useState } from 'react';
import { CloseIcon, SearchIcon } from '../icons';
import { searchGifs, trendingGifs } from '../../lib/media';

function gifPreviewUrl(g) {
  return (
    g.images?.fixed_height_small?.url ||
    g.images?.fixed_height?.url ||
    g.images?.downsized?.url ||
    g.images?.original?.url
  );
}

function gifSelectUrl(g) {
  return g.images?.fixed_height?.url || g.images?.original?.url;
}

/** Inner picker — remounts when opened so trending GIFs load automatically. */
function GifPickerPanel({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    trendingGifs()
      .then((data) => {
        if (!cancelled) setGifs(data);
      })
      .catch(() => {
        if (!cancelled) setGifs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = async () => {
    setLoading(true);
    try {
      setGifs(await searchGifs(query.trim()));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      runSearch();
    }
  };

  return (
    <div
      className="absolute bottom-full right-0 z-50 mb-2 flex w-80 max-h-96 flex-col overflow-hidden rounded-2xl border border-base-content/10 bg-base-200 shadow-xl"
      role="dialog"
      aria-label="GIF picker"
    >
      {/* Header — fixed, never scrolls */}
      <div className="flex shrink-0 items-center gap-2 border-b border-base-content/10 p-2">
        <div className="flex flex-1 gap-1">
          <input
            className="input input-bordered input-xs flex-1 rounded-full"
            placeholder="Search GIFs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="btn btn-primary btn-xs btn-circle"
            onClick={runSearch}
            aria-label="Search GIFs"
          >
            <SearchIcon />
          </button>
        </div>
        <button type="button" className="btn btn-ghost btn-xs btn-circle" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      {/* Grid — scroll contained inside the picker */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {loading && <p className="py-6 text-center text-xs opacity-50">Loading…</p>}
        {!loading && gifs.length === 0 && (
          <p className="py-6 text-center text-xs opacity-50">No GIFs found.</p>
        )}
        {!loading && gifs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((g) => (
              <button
                key={g.id}
                type="button"
                className="block h-24 w-full overflow-hidden rounded-lg bg-base-300/60 hover:ring-2 hover:ring-primary"
                onClick={() => {
                  onSelect(gifSelectUrl(g));
                  onClose();
                }}
              >
                <img
                  src={gifPreviewUrl(g)}
                  alt={g.title || 'GIF'}
                  className="h-24 w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GifPicker({ open, onClose, onSelect }) {
  if (!open) return null;
  return <GifPickerPanel onClose={onClose} onSelect={onSelect} />;
}
