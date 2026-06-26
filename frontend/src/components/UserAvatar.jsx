import { userAvatar } from '../lib/avatars';

/** Fixed DiceBear avatar for any user — no custom profile pictures. */
export default function UserAvatar({ user, className = 'w-9 rounded-full', alt = '' }) {
  return (
    <div className="avatar">
      <div className={className}>
        <img src={userAvatar(user)} alt={alt || user?.username || 'User'} />
      </div>
    </div>
  );
}
