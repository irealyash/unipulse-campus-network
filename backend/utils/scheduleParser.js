/**
 * scheduleParser.js
 *
 * Parses uploaded UBC Workday schedule files (.xlsx or CSV) to extract
 * enrolled course sections. This is the core mechanism for automatically
 * enrolling students into their course communities after they upload
 * their class schedule.
 *
 * Design approach:
 *   - Uses structural text-scraping via regex rather than relying on column
 *     headers, making it immune to header reordering or middleware corruptions
 *   - Handles multiple input formats: binary Excel (PK/zip), UTF-8 CSV,
 *     UTF-16LE CSV, plain text strings, and various middleware buffer wrappers
 *   - Extracts standardized UBC course codes like "CPSC 320-D2D" using a
 *     regex that accounts for Vancouver/Okanagan suffixes (_V, _O)
 *   - Returns deduplicated results to prevent duplicate enrollments
 */

import * as XLSX from 'xlsx';

/**
 * Parses a UBC Workday schedule file by performing a structural text-scrape.
 * Bypasses column headers completely to remain immune to middleware corruptions.
 *
 * Processing pipeline:
 *   1. Unpack polymorphic middleware buffer wrappers into a raw Buffer
 *   2. Detect file format (binary Excel vs CSV/text) via magic bytes
 *   3. Extract text content from all cells (Excel) or decode the buffer (CSV)
 *   4. Apply regex to find UBC course section patterns (e.g. "CPSC_V 320-921")
 *   5. Normalize and deduplicate extracted sections
 *
 * @param {Buffer|Object|string} bufferInput - The raw file buffer, middleware wrapper, or string
 * @returns {string[]} Array of unique, standardized sections, e.g. ["STAT 302-921", "CPSC 320-D2D"]
 */
export const parseScheduleFile = (bufferInput) => {
  if (!bufferInput) return [];

  let textContent = '';
  const excelStrings = [];

  // 1. Unpack polymorphic middleware buffers safely
  let buffer = bufferInput;
  if (buffer.buffer && !Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer.buffer);
  } else if (buffer.data) {
    buffer = Buffer.from(buffer.data);
  } else if (typeof buffer === 'object' && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
    buffer = Buffer.from(buffer.data);
  }

  // 2. Detect if binary Excel (PK zip signature) or CSV text stream
  const isExcel = Buffer.isBuffer(buffer) && buffer[0] === 0x50 && buffer[1] === 0x4B;

  if (isExcel) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      // Scrape every single populated cell across all sheets to build a text footprint
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        for (const cellRef in sheet) {
          if (cellRef.startsWith('!')) continue;
          const cell = sheet[cellRef];
          if (cell && cell.v !== undefined) excelStrings.push(String(cell.v));
          if (cell && cell.w !== undefined) excelStrings.push(String(cell.w));
        }
      }
      textContent = excelStrings.join('\n');
    } catch (err) {
      // Emergency fallback to standard string conversion if workbook parsing chokes
      textContent = buffer.toString('utf8');
    }
  } else {
    // Standard CSV or plain text string ingestion
    if (Buffer.isBuffer(buffer)) {
      const isUtf16le = buffer[0] === 0xFF && buffer[1] === 0xFE;
      textContent = isUtf16le ? buffer.toString('utf16le') : buffer.toString('utf8');
    } else if (typeof bufferInput === 'string') {
      textContent = bufferInput;
    } else {
      textContent = String(bufferInput);
    }
  }

  // 3. Extract matching UBC course structures via pattern matching
  // Matches: 3-4 letters (Dept), optional '_V' or '_O', spaces, 3-4 alphanumeric digits (Course), hyphen, 3 alphanumeric digits (Section)
  // Examples captured: "CPSC_V 320-921", "STAT 302-D2D", "ATSC_V 113-98A"
  const ubcSectionRegex = /\b([A-Z]{3,4})(?:_[VO])?\s+(\d{3}[A-Z]?)-([A-Z0-9]{2,4})\b/gi;
  
  const extractedSections = [];
  let match;

  while ((match = ubcSectionRegex.exec(textContent)) !== null) {
    const dept = match[1].toUpperCase();
    const courseNum = match[2].toUpperCase();
    const sectionCode = match[3].toUpperCase();

    // Reconstruct into clean standardized codes
    extractedSections.push(`${dept} ${courseNum}-${sectionCode}`);
  }

  // 4. Return clean, unique elements
  return [...new Set(extractedSections)];
};