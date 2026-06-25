/**
 * Schedule parsing.
 *
 * When a student uploads their class schedule we need to extract the set of
 * course sections they are enrolled in (e.g. "CPSC-110-101"). Those strings
 * become both their `enrolledSections` and the ids of the course communities
 * they are allowed to join.
 *
 * UBC's SSC lets students export a calendar (.ics) file. Each class meeting is
 * a VEVENT whose SUMMARY looks something like:
 *      SUMMARY:CPSC 110 101
 *      SUMMARY:MATH_V 100 LEC ...
 * We also gracefully accept plain text / JSON in case the frontend pre-parses
 * the file or the student pastes sections manually.
 *
 * The parser is intentionally forgiving and well-commented because real-world
 * schedule files vary a lot; tune the regex below if your sample files differ.
 */

// Matches a course code like:  CPSC 110 101  /  MATH_V 100 L1A  /  CPSC-121-200
// Group 1: department (2-5 letters, optional _V campus suffix)
// Group 2: course number (3 digits, optional trailing letter)
// Group 3: section (2-4 alphanumerics)
const COURSE_REGEX = /\b([A-Z]{2,5}(?:_[A-Z])?)[\s_-]+(\d{3}[A-Z]?)[\s_-]+([A-Z0-9]{2,4})\b/g;

/**
 * Normalizes a single (dept, number, section) tuple into our canonical
 * community id form: DEPT-NUMBER-SECTION, uppercased and stripped of the
 * campus suffix (e.g. "MATH_V" -> "MATH").
 */
const normalizeSection = (dept, number, section) => {
  const cleanDept = dept.replace(/_[A-Z]$/, '').toUpperCase(); // drop "_V" etc.
  return `${cleanDept}-${number.toUpperCase()}-${section.toUpperCase()}`;
};

/**
 * Extracts course sections from raw ICS text by scanning SUMMARY/DESCRIPTION
 * lines for course-code patterns.
 */
const parseIcs = (text) => {
  const sections = new Set();

  // ICS can fold long lines; unfold continuation lines (start with space/tab).
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  for (const line of lines) {
    if (!/^(SUMMARY|DESCRIPTION)/i.test(line)) continue;
    let match;
    COURSE_REGEX.lastIndex = 0; // reset stateful global regex per line
    while ((match = COURSE_REGEX.exec(line)) !== null) {
      sections.add(normalizeSection(match[1], match[2], match[3]));
    }
  }

  return [...sections];
};

/**
 * Fallback parser for plain text / CSV where each course appears somewhere in
 * the body. Also handles a JSON file shaped like { "sections": ["CPSC-110-101"] }.
 */
const parseFreeform = (text) => {
  // First, try JSON.
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) return dedupeUpper(json);
    if (Array.isArray(json?.sections)) return dedupeUpper(json.sections);
  } catch {
    // not JSON, fall through to regex scan
  }

  const sections = new Set();
  let match;
  COURSE_REGEX.lastIndex = 0;
  while ((match = COURSE_REGEX.exec(text)) !== null) {
    sections.add(normalizeSection(match[1], match[2], match[3]));
  }
  return [...sections];
};

// Uppercase + trim + dedupe helper for already-formatted section arrays.
const dedupeUpper = (arr) =>
  [...new Set(arr.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];

/**
 * Public entry point. Takes the uploaded file buffer + its mimetype/filename
 * and returns an array of normalized section ids. Returns [] if nothing found.
 *
 * @param {Buffer} buffer        - raw file contents (multer memory storage)
 * @param {string} originalName  - original filename, used to detect .ics
 * @returns {string[]} list of section ids like ["CPSC-110-101", "MATH-100-LEC"]
 */
export const parseScheduleFile = (buffer, originalName = '') => {
  const text = buffer.toString('utf-8');

  // Decide strategy: ICS files start with "BEGIN:VCALENDAR" or end in .ics.
  const looksLikeIcs =
    /\.ics$/i.test(originalName) || /BEGIN:VCALENDAR/i.test(text);

  const sections = looksLikeIcs ? parseIcs(text) : parseFreeform(text);

  // If an ICS produced nothing (unexpected format), try the freeform scan too.
  if (sections.length === 0 && looksLikeIcs) {
    return parseFreeform(text);
  }

  return sections;
};
