import { useState } from 'react';
import { CloseIcon } from '../icons';
import { searchGifs, trendingGifs } from '../../lib/media';

export default function GifPicker({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrending = () => {
    setLoading(true);
    trendingGifs()
      .then(setGifs)
      .catch(() => setGifs([]))
      .finally(() => setLoading(false));
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      setGifs(await searchGifs(query.trim()));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 max-h-80 bg-base-200 border border-base-content/10 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="p-2 border-b border-base-content/10 flex items-center gap-2">
        <form onSubmit={runSearch} className="flex-1 flex gap-1">
          <input
            className="input input-bordered input-xs rounded-full flex-1"
            placeholder="Search GIFs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-xs rounded-full">
            Go
          </button>
        </form>
        <button type="button" className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {gifs.length === 0 && !loading && (
        <div className="p-2">
          <button type="button" className="btn btn-ghost btn-xs w-full" onClick={loadTrending}>
            Load trending GIFs
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-1">
        {loading && <p className="col-span-2 text-center text-xs opacity-50 py-4">Loading…</p>}
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
