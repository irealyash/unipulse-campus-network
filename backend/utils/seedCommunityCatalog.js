import Community from '../models/Community.js';
import { POST_TAGS } from '../controllers/postController.js';
import { buildCatalogEntries } from '../data/communityCatalog.js';
import { catalogCommunityId } from './communityCategories.js';

/**
 * Idempotently seeds all catalog communities (countries, majors, residences, general).
 */
export const seedCommunityCatalog = async () => {
  const entries = buildCatalogEntries();
  let created = 0;

  for (const entry of entries) {
    const _id = catalogCommunityId(entry.category, entry.name);
    const result = await Community.updateOne(
      { _id },
      {
        $setOnInsert: {
          _id,
          name: entry.name,
          description: entry.description,
          type: 'general',
          category: entry.category,
          private: false,
          allowedTags: POST_TAGS,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }

  return { total: entries.length, created };
};
