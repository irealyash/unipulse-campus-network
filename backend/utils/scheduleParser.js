import * as XLSX from 'xlsx';

/**
 * Parses a UBC Workday schedule file by performing a structural text-scrape.
 * Bypasses column headers completely to remain immune to middleware corruptions.
 *
 * @param {any} bufferInput - The raw file buffer or wrapped object from your upload middleware
 * @returns {string[]} Array of unique, cleaned sections, e.g., ["STAT 302-921", "CPSC 320-D2D"]
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