/**
 * seedCommunityCatalog.js
 *
 * Bulk-seeds the community catalog into the database using idempotent upserts.
 * Reads community definitions from the static catalog data (countries, majors,
 * residences, general groups) and creates any that don't already exist.
 *
 * Uses MongoDB's $setOnInsert with upsert:true so existing communities are
 * never overwritten — moderator edits to name, description, or settings
 * are preserved across re-seeds.
 */

import Community from '../models/Community.js';
import { POST_TAGS } from '../controllers/postController.js';
import { buildCatalogEntries } from '../data/communityCatalog.js';
import { catalogCommunityId } from './communityCategories.js';

/**
 * Seeds all catalog communities into the database idempotently.
 * Each entry is upserted by its deterministic ID so only truly new
 * communities are created.
 *
 * @returns {Promise<{total: number, created: number}>}
 *   - total: number of catalog entries processed
 *   - created: number of new communities actually inserted
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
