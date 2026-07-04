/**
 * communityCategories.js
 *
 * Constants and helpers for community categorization and catalog ID generation.
 * Defines the allowed category types for communities, human-readable labels for
 * the UI, and a slug-based ID scheme used to create deterministic community IDs
 * from a category + name pair. These are consumed by the community seeding
 * pipeline, catalog browsing UI, and community creation flows.
 */

// All valid community categories, including "course" for auto-created course sections
/** Complete list of valid community categories (course sections use category "course"). */
export const COMMUNITY_CATEGORIES = ['international', 'academic', 'residence', 'general', 'faculty', 'course'];

/** Categories shown in the public catalog browser (excludes "course" since those are auto-enrolled). */
export const CATALOG_CATEGORIES = ['international', 'faculty', 'academic', 'residence', 'general'];

/** Human-readable display labels for each category, used in the UI. */
export const CATEGORY_LABELS = {
  international: 'International Communities',
  academic: 'Major Communities',
  residence: 'Residence Communities',
  general: 'General Communities',
  faculty: 'Faculty Communities',
  course: 'Course Communities',
};

/**
 * Converts a string into a URL-safe slug.
 * Normalizes unicode, strips diacritics, lowercases, and replaces
 * non-alphanumeric runs with hyphens.
 *
 * @param {string} value - The raw string to slugify
 * @returns {string} A lowercase, hyphen-separated slug (e.g. "São Paulo" -> "sao-paulo")
 */
export const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Generates a deterministic community _id from a category and name.
 * Used during catalog seeding to ensure idempotent upserts.
 *
 * @param {string} category - The community category (e.g. "international")
 * @param {string} name     - The community display name (e.g. "Brazil")
 * @returns {string} A stable ID like "international-brazil"
 */
export const catalogCommunityId = (category, name) => `${category}-${slugify(name)}`;
