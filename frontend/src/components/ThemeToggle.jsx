import { useEffect, useRef, useState } from 'react';

// The themes we registered in index.css (@plugin "daisyui").
const THEMES = ['cupcake', 'bumblebee', 'valentine', 'pastel', 'aqua', 'dracula', 'night'];
const STORAGE_KEY = 'unipulse_theme';

/**
 * Theme switcher. Persists the chosen DaisyUI theme to localStorage and applies
 * it via the `data-theme` attribute on <html>, which DaisyUI reads.
 *
 * We use a fully controlled open/close menu (instead of DaisyUI's focus-based
 * dropdown) so the options are always reliably clickable.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'cupcake');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Apply + persist the theme whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Close the menu when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const pick = (t) => {
    setTheme(t);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-sm gap-1"
        onClick={() => setOpen((o) => !o)}
      >
        🎨 <span className="hidden sm:inline capitalize">{theme}</span>
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 menu bg-base-200 rounded-box z-[100] w-44 p-2 shadow-xl border border-base-content/10">
          {THEMES.map((t) => (
            <li key={t}>
              <button
                type="button"
                className={`capitalize ${theme === t ? 'active' : ''}`}
                onClick={() => pick(t)}
              >
                <span
                  data-theme={t}
                  className="inline-flex gap-0.5 rounded-full p-1 bg-base-100 border border-base-content/10"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="w-2 h-2 rounded-full bg-accent" />
                </span>
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
