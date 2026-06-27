import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(en);

/** Names that don't resolve cleanly via i18n-iso-countries alone. */
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

/** ISO 3166-1 alpha-2 code for a catalog country name, or null if unknown. */
export function countryNameToCode(name) {
  if (!name) return null;
  if (OVERRIDES[name]) return OVERRIDES[name];
  return countries.getAlpha2Code(name, 'en') || null;
}
