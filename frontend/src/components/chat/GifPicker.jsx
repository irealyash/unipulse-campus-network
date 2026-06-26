import { useEffect, useState } from 'react';
import { CloseIcon, SearchIcon } from '../icons';
import { searchGifs, trendingGifs } from '../../lib/media';

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
    <div className="absolute bottom-full right-0 mb-2 w-72 max-h-80 bg-base-200 border border-base-content/10 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="p-2 border-b border-base-content/10 flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          <input
            className="input input-bordered input-xs rounded-full flex-1"
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
        <button type="button" className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-1">
        {loading && <p className="col-span-2 text-center text-xs opacity-50 py-4">Loading…</p>}
        {!loading && gifs.length === 0 && (
          <p className="col-span-2 text-center text-xs opacity-50 py-4">No GIFs found.</p>
        )}
        {!loading &&
          gifs.map((g) => (
            <button
              key={g.id}
              type="button"
              className="rounded-lg overflow-hidden hover:ring-2 ring-primary"
              onClick={() => {
                onSelect(g.images?.fixed_height?.url || g.images?.original?.url);
                onClose();
              }}
            >
              <img
                src={g.images?.fixed_height_small?.url}
                alt={g.title}
                className="w-full h-20 object-cover"
              />
            </button>
          ))}
      </div>
    </div>
  );
}

export default function GifPicker({ open, onClose, onSelect }) {
  if (!open) return null;
  return <GifPickerPanel onClose={onClose} onSelect={onSelect} />;
}
