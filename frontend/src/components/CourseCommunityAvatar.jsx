/**
 * CourseCommunityAvatar — text-based avatar for course-type communities.
 *
 * Instead of an image, renders the course section code (e.g. "CPSC 320 101")
 * as bold text inside a white box. Automatically measures and scales the font
 * size to fit the available container using a binary-search algorithm on a
 * hidden <canvas> for text measurement, plus a ResizeObserver to re-fit on
 * container resize.
 *
 * Props:
 * @param {string} sectionId — the course section identifier string
 * @param {string} className — additional Tailwind classes
 * @param {number} boxPx     — expected pixel size of the container
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { courseAvatarLayout, splitCourseSection } from '../lib/avatars';

const FONT = "'Inter', 'Montserrat', 'Roboto', sans-serif";
// Padding ratio relative to box size
const PAD_RATIO = 0.06;

/**
 * Binary-search the largest font size where all lines fit within innerW × innerH.
 * Uses a disposable <canvas> for measuring text width without DOM layout thrash.
 */
function fitFontSize(lines, innerW, innerH) {
  if (innerW <= 0 || innerH <= 0) return 8;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 8;

  let lo = 4;
  let hi = innerH;
  let best = 4;

  while (lo <= hi) {
    const mid = (lo + hi) / 2;
    ctx.font = `700 ${mid}px Inter, Montserrat, Roboto, sans-serif`;
    const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const totalH = lines.length * mid + Math.max(0, lines.length - 1) * mid * 0.02;
    if (maxW <= innerW && totalH <= innerH) {
      best = mid;
      lo = mid + 0.25;
    } else {
      hi = mid - 0.25;
    }
  }

  return Math.round(best * 10) / 10;
}

export default function CourseCommunityAvatar({ sectionId, className = '', boxPx = 48 }) {
  const ref = useRef(null);
  // Split the section id into display lines (e.g. ["CPSC 320", "101"])
  const lines = useMemo(() => splitCourseSection(sectionId), [sectionId]);
  const pad = Math.max(2, Math.round(boxPx * PAD_RATIO));
  // Initial font size estimate from the layout helper
  const fallback = courseAvatarLayout(sectionId, boxPx).fontSize;
  // Dynamically computed font size that fits the container
  const [fontSize, setFontSize] = useState(fallback);

  // Measure and fit the font size on mount and whenever the container resizes
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      const w = el.clientWidth || boxPx;
      const h = el.clientHeight || boxPx;
      const innerW = w - pad * 2;
      const innerH = h - pad * 2;
      setFontSize(fitFontSize(lines, innerW, innerH));
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sectionId, boxPx, pad, lines.join('|')]);

  return (
    <div
      ref={ref}
      className={`bg-white flex flex-col items-center justify-center text-center leading-none overflow-hidden box-border ${className}`}
      style={{
        fontFamily: FONT,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color: '#111111',
        letterSpacing: '-0.03em',
        padding: `${pad}px`,
        width: '100%',
        height: '100%',
      }}
      aria-hidden
    >
      {lines.map((line, i) => (
        <span
          key={`${line}-${i}`}
          className="block w-full whitespace-nowrap"
          style={{ lineHeight: 1 }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}
