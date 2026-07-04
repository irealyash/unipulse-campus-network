/**
 * COMMUNITY CATEGORIES
 * ----------------------------------------------------------------------------
 * Constants for community catalog categories used in the browse/catalog UI
 * and the post-signup onboarding flow. Defines the ordered list of categories,
 * their full display labels, and short labels for compact views.
 */

/** Ordered list of browsable catalog category IDs (excludes 'course' which is enrollment-based). */
export const CATALOG_CATEGORIES = ['international', 'faculty', 'academic', 'residence', 'general'];

/** Full display labels for each category (used in headings and onboarding). */
export const CATEGORY_LABELS = {
  international: 'International Communities',
  faculty: 'Faculty Communities',
  academic: 'Major Communities',
  residence: 'Residence Communities',
  general: 'General Communities',
  course: 'Course Communities',
};

/** Short labels for each category (used in compact UI elements like badges). */
export const CATEGORY_SHORT = {
  international: 'International',
  faculty: 'Faculty',
  academic: 'Major',
  residence: 'Residence',
  general: 'General',
};

/** Onboarding step definitions — one step per catalog category with its display label. */
export const ONBOARDING_STEPS = CATALOG_CATEGORIES.map((id) => ({
  id,
  label: CATEGORY_LABELS[id],
}));
