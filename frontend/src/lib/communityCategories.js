export const CATALOG_CATEGORIES = ['international', 'faculty', 'academic', 'residence', 'general'];

export const CATEGORY_LABELS = {
  international: 'International Communities',
  faculty: 'Faculty Communities',
  academic: 'Major Communities',
  residence: 'Residence Communities',
  general: 'General Communities',
  course: 'Course Communities',
};

export const CATEGORY_SHORT = {
  international: 'International',
  faculty: 'Faculty',
  academic: 'Major',
  residence: 'Residence',
  general: 'General',
};

export const ONBOARDING_STEPS = CATALOG_CATEGORIES.map((id) => ({
  id,
  label: CATEGORY_LABELS[id],
}));
