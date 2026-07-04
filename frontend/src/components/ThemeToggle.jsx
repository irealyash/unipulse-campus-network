/**
 * ThemeToggle — DaisyUI theme switcher button with a portal dropdown menu.
 *
 * Persists the selected theme to localStorage and applies it via the
 * `data-theme` attribute on <html>. Also updates the browser favicon
 * to match the chosen theme's colours.
 *
 * The dropdown menu is portaled to <body> so it stacks above all content.
 *
 * Used in Navbar, CommunityShell header, and AuthShell.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { updateThemeFavicon } from '../lib/favicon';

// Available DaisyUI themes registered in index.css
const THEMES = [
  { id: 'cupcake', label: 'Cupcake' },
  { id: 'bumblebee', label: 'Bumblebee' },
  { id: 'valentine', label: 'Valentine' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'aqua', label: 'Aqua' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'night', label: 'Night' },
  { id: 'true-dark', label: 'True Dark' },
];
// localStorage key for persisting the selected theme
const STORAGE_KEY = 'unipulse_theme';

// Look up the user-friendly label for a theme id
const themeLabel = (id) => THEMES.find((t) => t.id === id)?.label || id;

export default function ThemeToggle() {
  // Active theme id, defaulting to 'dracula' on first visit
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dracula');
  // Whether the theme menu dropdown is open
  const [open, setOpen] = useState(false);
  // Absolute position for the portal menu
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Apply theme to the document and persist it whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateThemeFavicon();
  }, [theme]);

  // Recalculate menu position based on the toggle button's bounding rect
  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: rect.right });
  };

  // Close on outside click; keep position in sync on resize/scroll
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

  // Select a theme and close the dropdown
  const pick = (id) => {
    setTheme(id);
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
            <li key={t.id}>
              <button
                type="button"
                className={`w-full ${theme === t.id ? 'active' : ''}`}
                onClick={() => pick(t.id)}
              >
                <span
                  data-theme={t.id}
                  className="inline-flex gap-0.5 rounded-full p-1 bg-base-100 border border-base-content/10 pointer-events-none"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="w-2 h-2 rounded-full bg-accent" />
                </span>
                {t.label}
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
        🎨 <span className="hidden sm:inline">{themeLabel(theme)}</span>
      </button>
      {menu}
    </>
  );
}
