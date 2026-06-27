import Flags from 'country-flag-icons/react/3x2';
import CourseCommunityAvatar from './CourseCommunityAvatar';
import { communityAvatar } from '../lib/avatars';
import { countryNameToCode } from '../lib/countryCodes';

/**
 * Community profile picture — country flag for international communities only.
 */
export default function CommunityAvatar({ community, className = '', boxPx = 48 }) {
  if (community?.type === 'course') {
    return (
      <CourseCommunityAvatar sectionId={community._id} className={className} boxPx={boxPx} />
    );
  }

  if (community?.category === 'international') {
    const code = countryNameToCode(community.name);
    const Flag = Flags[code];
    if (Flag) {
      return (
        <Flag
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
