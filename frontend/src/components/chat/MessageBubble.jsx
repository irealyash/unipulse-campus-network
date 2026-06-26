import { EmojiIcon, ReplyIcon, FlagIcon, ThumbUpIcon, ThumbDownIcon } from '../icons';
import UserAvatar from '../UserAvatar';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😮', '😢'];

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const groupReactions = (reactions, myId) => {
  const map = {};
  (reactions || []).forEach((r) => {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
    map[r.emoji].count += 1;
    if (String(r.userId) === String(myId)) map[r.emoji].mine = true;
  });
  return map;
};

function MediaContent({ media, content }) {
  if (media?.url) {
    if (media.mediaType === 'video') {
      return <video src={media.url} controls className="max-w-xs rounded-lg mt-1" />;
    }
    return (
      <img src={media.url} alt="" className="max-w-xs rounded-lg mt-1 max-h-64 object-contain" />
    );
  }
  if (!content) return null;
  if (/^https?:\/\/.+\.(gif|giphy)/i.test(content)) {
    return <img src={content} alt="" className="max-w-xs rounded-lg mt-1" />;
  }
  return <span>{content}</span>;
}

export default function MessageBubble({
  message,
  myUsername,
  myId,
  myReactions = {},
  onReact,
  onEmoji,
  onReport,
  onReply,
  onScrollToParent,
  messageRef,
}) {
  const isOwn = message.anonymousUsername === myUsername;
  const targetType = message.itemType === 'reply' ? 'reply' : 'message';
  const grouped = groupReactions(message.reactions, myId);
  const myReaction = myReactions[message._id];

  return (
    <div
      ref={messageRef}
      id={`msg-${message._id}`}
      className={`msg-row flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-pop-in max-w-full`}
    >
      <div className={`flex gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        <UserAvatar user={{ username: message.anonymousUsername, id: message._id }} />

        <div className={`min-w-0 flex-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="text-xs opacity-60 mb-0.5">
            {message.anonymousUsername}
            <time className="ml-2 opacity-70">{formatTime(message.createdAt)}</time>
          </div>

          {message.parentMessageId && (
            <button
              type="button"
              className="reply-quote text-left text-xs mb-1 max-w-full"
              onClick={() => onScrollToParent?.(message.parentMessageId)}
            >
              <span className="text-primary font-medium">
                {message.parentAuthor || 'User'}
              </span>
              <p className="truncate text-base-content/50">{message.parentPreview}</p>
            </button>
          )}

          <div
            className={`relative rounded-2xl px-3 py-2 text-sm break-words ${
              isOwn ? 'bg-primary text-primary-content' : 'bg-base-200'
            }`}
          >
            <MediaContent media={message.media} content={message.content} />

            <div className="msg-actions absolute -top-8 right-0 flex items-center gap-0.5 bg-base-100 rounded-full shadow border border-base-200 px-0.5">
              <div className="dropdown dropdown-top dropdown-end">
                <button tabIndex={0} className="btn btn-ghost btn-xs" type="button" title="React">
                  <EmojiIcon />
                </button>
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 rounded-2xl shadow-lg border p-1 flex gap-0.5 mb-1 z-30"
                >
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="btn btn-ghost btn-xs px-1"
                      onClick={() => onEmoji(targetType, message._id, em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                title="Reply"
                onClick={() =>
                  onReply?.({
                    id: message._id,
                    author: message.anonymousUsername,
                    preview: message.content || (message.media ? '[media]' : ''),
                  })
                }
              >
                <ReplyIcon />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error/80"
                title="Report"
                onClick={() => onReport({ contentType: targetType, contentId: message._id })}
              >
                <FlagIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-1">
            <button
              type="button"
              className={`btn btn-xs rounded-full gap-0.5 ${
                myReaction === 'like' ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() =>
                onReact(targetType, message._id, myReaction === 'like' ? 'none' : 'like')
              }
            >
              <ThumbUpIcon /> {message.likeCount || 0}
            </button>
            <button
              type="button"
              className={`btn btn-xs rounded-full gap-0.5 ${
                myReaction === 'dislike' ? 'btn-error' : 'btn-ghost'
              }`}
              onClick={() =>
                onReact(targetType, message._id, myReaction === 'dislike' ? 'none' : 'dislike')
              }
            >
              <ThumbDownIcon /> {message.dislikeCount || 0}
            </button>
            {Object.entries(grouped).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                type="button"
                className={`btn btn-xs rounded-full ${mine ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => onEmoji(targetType, message._id, emoji)}
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
