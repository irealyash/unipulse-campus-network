/** Public catalog categories (course sections use category "course"). */
export const COMMUNITY_CATEGORIES = ['international', 'academic', 'residence', 'general', 'faculty', 'course'];

export const CATALOG_CATEGORIES = ['international', 'faculty', 'academic', 'residence', 'general'];

export const CATEGORY_LABELS = {
  international: 'International Communities',
  academic: 'Major Communities',
  residence: 'Residence Communities',
  general: 'General Communities',
  faculty: 'Faculty Communities',
  course: 'Course Communities',
};

export const slugify = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const catalogCommunityId = (category, name) => `${category}-${slugify(name)}`;
