import { EmojiIcon, ReplyIcon, FlagIcon, ThumbUpIcon, ThumbDownIcon, TrashIcon } from '../icons';
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
      return <video src={media.url} controls className="max-w-full max-h-72 w-auto block" />;
    }
    return (
      <img src={media.url} alt="" className="max-w-full max-h-72 w-auto block object-contain" />
    );
  }
  if (!content) return null;
  return <p className="text-sm whitespace-pre-wrap break-words px-3 py-2">{content}</p>;
}

function MessageActions({ targetType, message, isOwn, onEmoji, onReply, onReport, onDelete }) {
  return (
    <div className="msg-actions flex flex-col items-center gap-0 bg-base-100 rounded-full shadow border border-base-200 px-0.5 py-0.5 shrink-0 self-start">
      {isOwn && (
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-square text-error"
          title="Delete"
          onClick={() => onDelete?.(targetType, message._id)}
        >
          <TrashIcon />
        </button>
      )}
      <div className="dropdown dropdown-top">
        <button tabIndex={0} className="btn btn-ghost btn-xs btn-square" type="button" title="React">
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
        className="btn btn-ghost btn-xs btn-square"
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
        className="btn btn-ghost btn-xs btn-square text-error/80"
        title="Report"
        onClick={() => onReport({ contentType: targetType, contentId: message._id })}
      >
        <FlagIcon />
      </button>
    </div>
  );
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
  onDelete,
  onScrollToParent,
  messageRef,
}) {
  const isOwn = message.anonymousUsername === myUsername;
  const targetType = message.itemType === 'reply' ? 'reply' : 'message';
  const grouped = groupReactions(message.reactions, myId);
  const myReaction = myReactions[message._id];
  const hasMedia = Boolean(message.media?.url);
  const hasText = Boolean(message.content?.trim());
  const hasReply = Boolean(message.parentMessageId);

  const bubbleClass = isOwn
    ? 'bg-primary text-primary-content'
    : 'bg-base-200 text-base-content';

  return (
    <div
      ref={messageRef}
      id={`msg-${message._id}`}
      className={`msg-row group w-full flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-pop-in`}
    >
      <div
        className={`flex items-end gap-2 max-w-[min(100%,42rem)] ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <UserAvatar
          user={{ username: message.anonymousUsername, id: message._id }}
          className="w-9 h-9"
        />

        <div className={`flex flex-wrap items-end gap-1 min-w-0 max-w-full ${isOwn ? 'flex-row-reverse' : ''}`}>
          <MessageActions
            targetType={targetType}
            message={message}
            isOwn={isOwn}
            onEmoji={onEmoji}
            onReply={onReply}
            onReport={onReport}
            onDelete={onDelete}
          />

          <div className="flex flex-col min-w-0 max-w-full">
            <div className={`min-w-0 max-w-full rounded-xl overflow-hidden shadow-sm ${bubbleClass}`}>
              {hasReply && (
                <button
                  type="button"
                  className={`block w-full text-left px-2 pt-2 pb-1 border-l-[3px] ${
                    isOwn
                      ? 'border-primary-content/80 bg-primary-content/10'
                      : 'border-primary bg-base-content/5'
                  }`}
                  onClick={() => onScrollToParent?.(message.parentMessageId)}
                >
                  <span
                    className={`text-xs font-semibold block ${
                      isOwn ? 'text-primary-content' : 'text-primary'
                    }`}
                  >
                    {message.parentAuthor || 'User'}
                  </span>
                  <span
                    className={`text-xs line-clamp-2 block mt-0.5 ${
                      isOwn ? 'text-primary-content/70' : 'opacity-70'
                    }`}
                  >
                    {message.parentPreview}
                  </span>
                </button>
              )}

              <MediaContent media={message.media} content={hasMedia ? '' : message.content} />

              {hasText && hasMedia && (
                <p className="text-sm whitespace-pre-wrap break-words px-3 pb-2">{message.content}</p>
              )}

              <div
                className={`flex justify-end items-center gap-1 px-2 pb-1 ${
                  hasMedia || hasText || hasReply ? '' : 'pt-2'
                }`}
              >
                <time className={`text-[10px] ${isOwn ? 'text-primary-content/70' : 'opacity-60'}`}>
                  {formatTime(message.createdAt)}
                </time>
              </div>
            </div>

            {/* Like / dislike aligned with bubble left edge */}
            <div className="flex items-center gap-0 mt-0.5">
              <button
                type="button"
                className={`btn btn-xs rounded-full gap-0 px-1.5 min-h-0 h-6 ${
                  myReaction === 'dislike' ? 'btn-error' : 'btn-ghost'
                }`}
                onClick={() =>
                  onReact(targetType, message._id, myReaction === 'dislike' ? 'none' : 'dislike')
                }
              >
                <ThumbDownIcon /> <span className="text-xs">{message.dislikeCount || 0}</span>
              </button>
              <button
                type="button"
                className={`btn btn-xs rounded-full gap-0 px-1.5 min-h-0 h-6 -ml-0.5 ${
                  myReaction === 'like' ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() =>
                  onReact(targetType, message._id, myReaction === 'like' ? 'none' : 'like')
                }
              >
                <ThumbUpIcon /> <span className="text-xs">{message.likeCount || 0}</span>
              </button>
              {Object.entries(grouped).map(([emoji, { count, mine }]) => (
                <button
                  key={emoji}
                  type="button"
                  className={`btn btn-xs rounded-full ml-1 min-h-0 h-6 ${mine ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => onEmoji(targetType, message._id, emoji)}
                >
                  {emoji} {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
