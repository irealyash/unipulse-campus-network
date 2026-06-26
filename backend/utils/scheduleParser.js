/**
 * Schedule parsing — extracts course section ids from a UBC schedule .xlsx file.
 *
 * Section ids (e.g. "CPSC-110-101") become enrolledSections and private course
 * community ids. Extraction rules will be refined when the xlsx layout is finalized;
 * for now we scan all sheet cells for course-code patterns.
 */

import * as XLSX from 'xlsx';

const COURSE_REGEX = /\b([A-Z]{2,5}(?:_[A-Z])?)[\s_-]+(\d{3}[A-Z]?)[\s_-]+([A-Z0-9]{2,4})\b/g;

const normalizeSection = (dept, number, section) => {
  const cleanDept = dept.replace(/_[A-Z]$/, '').toUpperCase();
  return `${cleanDept}-${number.toUpperCase()}-${section.toUpperCase()}`;
};

const dedupeUpper = (arr) =>
  [...new Set(arr.map((s) => String(s).trim().toUpperCase()).filter(Boolean))];

const extractSectionsFromText = (text) => {
  const sections = new Set();
  let match;
  COURSE_REGEX.lastIndex = 0;
  while ((match = COURSE_REGEX.exec(text)) !== null) {
    sections.add(normalizeSection(match[1], match[2], match[3]));
  }
  return [...sections];
};

/**
 * Parses a UBC schedule workbook (.xlsx).
 * TODO: replace cell scan with column-aware extraction once xlsx layout is defined.
 */
export const parseXlsxSchedule = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sections = new Set();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const text = rows.flat().map((cell) => String(cell)).join(' ');
    extractSectionsFromText(text).forEach((s) => sections.add(s));
  }

  return [...sections];
};

/**
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {string[]} section ids like ["CPSC-110-101"]
 */
export const parseScheduleFile = (buffer, originalName = '') => {
  const isXlsx =
    /\.xlsx$/i.test(originalName) ||
    (buffer[0] === 0x50 && buffer[1] === 0x4b); // ZIP / OOXML magic bytes

  if (!isXlsx) {
    return [];
  }

  return parseXlsxSchedule(buffer);
};
