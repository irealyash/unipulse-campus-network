/**
 * GifPicker — Giphy-powered GIF search popover. Appears as a floating panel
 * anchored to the GIF button in ChatInput.
 *
 * Loads trending GIFs on open; user can search for specific keywords.
 * Selecting a GIF calls onSelect(url) and closes the picker.
 *
 * Props (outer wrapper):
 * @param {boolean}   open     — whether the picker is visible
 * @param {() => void} onClose — close the picker
 * @param {(url: string) => void} onSelect — called with the selected GIF URL
 */
import { useEffect, useState } from 'react';
import { CloseIcon, SearchIcon } from '../icons';
import { searchGifs, trendingGifs } from '../../lib/media';

// Pick the smallest usable preview URL from Giphy's images object
function gifPreviewUrl(g) {
  return (
    g.images?.fixed_height_small?.url ||
    g.images?.fixed_height?.url ||
    g.images?.downsized?.url ||
    g.images?.original?.url
  );
}

// Pick the best quality URL to send as the actual message
function gifSelectUrl(g) {
  return g.images?.fixed_height?.url || g.images?.original?.url;
}

/** Inner picker panel — remounts when opened so trending GIFs load automatically. */
function GifPickerPanel({ onClose, onSelect }) {
  // Search query text
  const [query, setQuery] = useState('');
  // Array of Giphy GIF objects
  const [gifs, setGifs] = useState([]);
  // Loading state for both trending fetch and search
  const [loading, setLoading] = useState(true);

  // Fetch trending GIFs on mount
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

  // Execute a keyword search against the Giphy API
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

  // Trigger search on Enter key press
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

/** Outer wrapper — renders nothing when closed; remounts the panel on each open. */
export default function GifPicker({ open, onClose, onSelect }) {
  if (!open) return null;
  return <GifPickerPanel onClose={onClose} onSelect={onSelect} />;
}
