import { courseAvatarFontPx, splitCourseSection } from '../lib/avatars';

const FONT = "'Inter', 'Montserrat', 'Roboto', sans-serif";

/**
 * Course-section community avatar — HTML text with web fonts (crisp at any size).
 */
export default function CourseCommunityAvatar({ sectionId, className = '', boxPx = 48 }) {
  const lines = splitCourseSection(sectionId);
  const fontSize = courseAvatarFontPx(sectionId, boxPx);

  return (
    <div
      className={`bg-white flex flex-col items-center justify-center text-center leading-none overflow-hidden ${className}`}
      style={{
        fontFamily: FONT,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        color: '#111111',
        letterSpacing: '-0.025em',
      }}
      aria-hidden
    >
      {lines.map((line, i) => (
        <span
          key={`${line}-${i}`}
          className={`block w-full px-0.5 whitespace-nowrap ${i === 1 ? 'mt-0.5' : ''}`}
          style={{ lineHeight: 1.05 }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}
