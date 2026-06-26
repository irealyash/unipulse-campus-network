import { userAvatar } from '../lib/avatars';

/** Fixed DiceBear avatar — explicit square size so it never stretches. */
export default function UserAvatar({ user, className = 'w-9 h-9', alt = '' }) {
  return (
    <div className={`avatar shrink-0 ${className} rounded-full overflow-hidden`}>
      <img
        src={userAvatar(user)}
        alt={alt || user?.username || 'User'}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
