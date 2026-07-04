/**
 * COUNTRY CODE RESOLVER
 * ----------------------------------------------------------------------------
 * Converts country names (as used in the international communities catalog)
 * to ISO 3166-1 alpha-2 codes for displaying flag emojis/icons. Uses the
 * i18n-iso-countries library with a manual overrides table for names that
 * don't resolve cleanly through the standard lookup.
 */

import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

// Register English locale data for country name resolution.
countries.registerLocale(en);

/** Manual overrides for country names that i18n-iso-countries doesn't resolve correctly. */
const OVERRIDES = {
  'Bolivia': 'BO',
  'Brunei': 'BN',
  'Cabo Verde': 'CV',
  Congo: 'CG',
  'Côte d\'Ivoire': 'CI',
  Czechia: 'CZ',
  'Democratic Republic of the Congo': 'CD',
  Eswatini: 'SZ',
  Iran: 'IR',
  Laos: 'LA',
  Micronesia: 'FM',
  Moldova: 'MD',
  'North Korea': 'KP',
  'North Macedonia': 'MK',
  Palestine: 'PS',
  Russia: 'RU',
  'South Korea': 'KR',
  Syria: 'SY',
  Taiwan: 'TW',
  Tanzania: 'TZ',
  'Timor-Leste': 'TL',
  Turkey: 'TR',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Vatican City': 'VA',
  Venezuela: 'VE',
};

/**
 * Convert a catalog country name to its ISO 3166-1 alpha-2 code.
 * Checks manual overrides first, then falls back to i18n-iso-countries lookup.
 * @param {string} name - The country name (e.g. "South Korea", "Germany").
 * @returns {string|null} Two-letter country code (e.g. "KR"), or null if unknown.
 */
export function countryNameToCode(name) {
  if (!name) return null;
  if (OVERRIDES[name]) return OVERRIDES[name];
  return countries.getAlpha2Code(name, 'en') || null;
}
