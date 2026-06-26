import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// The themes we registered in index.css (@plugin "daisyui").
const THEMES = ['cupcake', 'bumblebee', 'valentine', 'pastel', 'aqua', 'dracula', 'night'];
const STORAGE_KEY = 'unipulse_theme';

/**
 * Theme switcher. Persists the chosen DaisyUI theme to localStorage and applies
 * it via the `data-theme` attribute on <html>, which DaisyUI reads.
 *
 * The menu is portaled to <body> so it always stacks above page content
 * (e.g. landing hero sections that share the same z-index as the navbar).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dracula');
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.right });
  };

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

  const pick = (t) => {
    setTheme(t);
    setOpen(false);
  };

  const menu = open
    ? createPortal(
        <ul
          ref={menuRef}
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-[9999] -translate-x-full menu bg-base-200 rounded-box w-44 p-2 shadow-xl border border-base-content/10"
        >
          {THEMES.map((t) => (
            <li key={t}>
              <button
                type="button"
                className={`capitalize w-full ${theme === t ? 'active' : ''}`}
                onClick={() => pick(t)}
              >
                <span
                  data-theme={t}
                  className="inline-flex gap-0.5 rounded-full p-1 bg-base-100 border border-base-content/10 pointer-events-none"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="w-2 h-2 rounded-full bg-accent" />
                </span>
                {t}
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
        className="btn btn-ghost btn-sm gap-1"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        🎨 <span className="hidden sm:inline capitalize">{theme}</span>
      </button>
      {menu}
    </>
  );
}
