/**
 * CommunityAvatar — renders the appropriate avatar for a community based on
 * its type and category:
 *   - "course" type → CourseCommunityAvatar (text-based section code)
 *   - "international" category → CountryFlag (SVG flag)
 *   - all other → DiceBear-generated community avatar image
 *
 * Props:
 * @param {object} community — the community object (.type, .category, .name, ._id)
 * @param {string} className — additional Tailwind classes
 * @param {number} boxPx     — pixel size hint for the avatar renderer
 */
import CourseCommunityAvatar from './CourseCommunityAvatar';
import CountryFlag from './CountryFlag';
import { communityAvatar } from '../lib/avatars';
import { countryNameToCode } from '../lib/countryCodes';

export default function CommunityAvatar({ community, className = '', boxPx = 48 }) {
  if (community?.type === 'course') {
    return (
      <CourseCommunityAvatar sectionId={community._id} className={className} boxPx={boxPx} />
    );
  }

  if (community?.category === 'international') {
    const code = countryNameToCode(community.name);
    if (code) {
      return (
        <CountryFlag
          code={code}
          title={community.name}
          className={`w-full h-full object-cover ${className}`}
        />
      );
    }
  }

  return (
    <img
      src={communityAvatar(community)}
      alt=""
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
