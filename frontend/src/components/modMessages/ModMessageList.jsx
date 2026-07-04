/**
 * ModMessageList — read-only scrollable message list for moderator ↔ user
 * direct messages. Shows an optional header with the contact's name, and
 * auto-scrolls to the bottom when new messages arrive.
 *
 * Used inside ModUserMessagesPanel (moderator inbox) and UserMessagesPage
 * (user-side DM view).
 */
import { useEffect, useRef } from 'react';
import UserAvatar from '../UserAvatar';
import { ShieldIcon } from '../icons';

/** Renders media (image/video) or plain text content inside a DM bubble. */
function MediaBlock({ media, content }) {
  if (media?.url) {
    if (media.mediaType === 'video') {
      return <video src={media.url} controls className="max-w-full max-h-72 w-auto block rounded-lg" />;
    }
    return (
      <img src={media.url} alt="" className="max-w-full max-h-72 w-auto block object-contain rounded-lg" />
    );
  }
  if (!content) return null;
  return <p className="text-sm whitespace-pre-wrap break-words">{content}</p>;
}

/**
 * ModMessageBubble — single DM bubble showing the sender's avatar
 * (shield icon for moderators, user avatar otherwise), message content,
 * and timestamp. Right-aligned when the message is from the current user.
 */
function ModMessageBubble({ message, myId }) {
  const mine = String(message.senderId) === String(myId);
  const isMod = message.senderRole === 'moderator';

  return (
    <div className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
      <div className="shrink-0 mt-1">
        {isMod ? (
          <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary grid place-items-center">
            <ShieldIcon className="text-base" />
          </div>
        ) : (
          <UserAvatar user={{ username: message.senderUsername }} className="w-8 h-8" />
        )}
      </div>
      <div
        className={`max-w-[min(100%,28rem)] rounded-2xl px-3 py-2 ${
          mine ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'
        }`}
      >
        <p className={`text-[10px] font-semibold mb-1 ${mine ? 'text-primary-content/80' : 'text-base-content/50'}`}>
          {message.senderUsername}
          {isMod ? ' · Moderator' : ''}
        </p>
        <MediaBlock media={message.media} content={message.content} />
        <p className={`text-[10px] mt-1 ${mine ? 'text-primary-content/60' : 'text-base-content/40'}`}>
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Props:
 * @param {Array}  messages — array of message objects
 * @param {string} myId     — current user's id (to determine own vs other)
 * @param {string} [title]  — contact name shown in the header
 * @param {string} [subtitle] — secondary text below the title
 */
export default function ModMessageList({ messages, myId, title, subtitle }) {
  const scrollRef = useRef(null);

  // Auto-scroll to the newest message whenever the list grows
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {(title || subtitle) && (
        <div className="shrink-0 border-b border-base-200 px-4 py-3 bg-base-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary grid place-items-center shrink-0">
              <ShieldIcon />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate">{title}</h2>
              {subtitle && <p className="text-xs text-base-content/50 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-base-content/50 py-8">No messages yet.</p>
        ) : (
          messages.map((m) => <ModMessageBubble key={m._id} message={m} myId={myId} />)
        )}
      </div>
    </div>
  );
}
