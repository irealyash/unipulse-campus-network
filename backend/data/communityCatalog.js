import { COUNTRIES } from './countries.js';

export const MAJOR_COMMUNITIES = [
  { name: 'Astronomy Major', category: 'Academic' },
  { name: 'Atmospheric Science Major', category: 'Academic' },
  { name: 'Biochemistry Major', category: 'Academic' },
  { name: 'Biology Major', category: 'Academic' },
  { name: 'Biotechnology Honours', category: 'Academic' },
  { name: 'Cellular, Anatomical + Physiological Sciences Major', category: 'Academic' },
  { name: 'Chemistry Major', category: 'Academic' },
  { name: 'Cognitive Systems: Cognition and Brain Major', category: 'Academic' },
  { name: 'Cognitive Systems: Computational Intelligence + Design Major', category: 'Academic' },
  { name: 'Computer Science Major', category: 'Academic' },
  { name: 'Data Science Major', category: 'Academic' },
  { name: 'Earth and Ocean Sciences Major', category: 'Academic' },
  { name: 'Environmental Sciences Major', category: 'Academic' },
  { name: 'Fisheries Oceanography Honours', category: 'Academic' },
  { name: 'Geographical Sciences Major', category: 'Academic' },
  { name: 'Geology Major', category: 'Academic' },
  { name: 'Geophysics Major', category: 'Academic' },
  { name: 'Integrated Sciences Major', category: 'Academic' },
  { name: 'Mathematics Major', category: 'Academic' },
  { name: 'Mathematical Sciences Major', category: 'Academic' },
  { name: 'Microbiology and Immunology Major', category: 'Academic' },
  { name: 'Neuroscience Major', category: 'Academic' },
  { name: 'Pharmacology Major', category: 'Academic' },
  { name: 'Physics Major', category: 'Academic' },
  { name: 'Physics Honours', category: 'Academic' },
  { name: 'Statistics Major', category: 'Academic' },
];

export const RESIDENCE_COMMUNITIES = [
  'Acadia Park',
  'Brock Commons',
  'Exchange',
  'Fairview Crescent',
  'Fraser Hall',
  'Graduate Colleges',
  'Iona House',
  'Marine Drive',
  'Orchard Commons',
  'Place Vanier',
  'Ponderosa Commons',
  'Ritsumeikan-UBC House',
  'tə šxʷhəleləm̓s tə kʷaƛ̓kʷəʔaʔɬ',
  'Thunderbird',
  'Totem Park',
  'Walter Gage',
];

export const GENERAL_COMMUNITIES = [
  'UBC General',
  'UBC Casual',
  'UBC Esports',
  'UBC Sports',
  'UBC Fun',
  'UBC Random',
  'UBC Lost & Found',
  'UBC Confessions',
  'UBC Buy & Sell',
  'UBC Housing',
  'UBC Career & Co-op',
  'UBC Foodies',
];

export const FACULTY_COMMUNITIES = [
  { name: 'Applied Science Faculty', category: 'Faculty' },
  { name: 'Architecture and Landscape Architecture School', category: 'Faculty' },
  { name: 'Arts Faculty', category: 'Faculty' },
  { name: 'Audiology and Speech Sciences School', category: 'Faculty' },
  { name: 'Sauder School of Business', category: 'Faculty' },
  { name: 'Community and Regional Planning School', category: 'Faculty' },
  { name: 'Dentistry Faculty', category: 'Faculty' },
  { name: 'Education Faculty', category: 'Faculty' },
  { name: 'Extended Learning', category: 'Faculty' },
  { name: 'Forestry & Environmental Stewardship Faculty', category: 'Faculty' },
  { name: 'Graduate and Postdoctoral Studies', category: 'Faculty' },
  { name: 'Information School', category: 'Faculty' },
  { name: 'Journalism School', category: 'Faculty' },
  { name: 'Kinesiology School', category: 'Faculty' },
  { name: 'Land and Food Systems Faculty', category: 'Faculty' },
  { name: 'Peter A. Allard School of Law', category: 'Faculty' },
  { name: 'Medicine Faculty', category: 'Faculty' },
  { name: 'Music School', category: 'Faculty' },
  { name: 'Nursing School', category: 'Faculty' },
  { name: 'Pharmaceutical Sciences Faculty', category: 'Faculty' },
  { name: 'Population and Public Health School', category: 'Faculty' },
  { name: 'Public Policy and Global Affairs School', category: 'Faculty' },
  { name: 'Science Faculty', category: 'Faculty' },
  { name: 'Social Work School', category: 'Faculty' },
  { name: 'UBC Vantage College', category: 'Faculty' },
  { name: 'Vancouver School of Economics', category: 'Faculty' },
];

export const buildCatalogEntries = () => {
  const entries = [];

  for (const country of COUNTRIES) {
    entries.push({
      category: 'international',
      name: country,
      description: `Connect with students from ${country}.`,
    });
  }

  for (const { name } of MAJOR_COMMUNITIES) {
    entries.push({
      category: 'academic',
      name,
      description: `Community for ${name} students at UBC.`,
    });
  }

  for (const { name } of FACULTY_COMMUNITIES) {
    entries.push({
      category: 'faculty',
      name,
      description: `Students in the ${name}.`,
    });
  }

  for (const name of RESIDENCE_COMMUNITIES) {
    entries.push({
      category: 'residence',
      name,
      description: `Residents of ${name}.`,
    });
  }

  for (const name of GENERAL_COMMUNITIES) {
    entries.push({
      category: 'general',
      name,
      description: `${name} — campus-wide discussion.`,
    });
  }

  return entries;
};
