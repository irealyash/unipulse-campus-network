import { useState } from 'react';
import { EmojiIcon, ReplyIcon, FlagIcon, ThumbUpIcon, ThumbDownIcon, SendIcon } from '../icons';

// Quick-reaction emoji palette shown in the hover popover.
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😮', '😢'];

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Group a reactions[] array into { emoji: { count, mine } }.
const groupReactions = (reactions, myId) => {
  const map = {};
  (reactions || []).forEach((r) => {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, mine: false };
    map[r.emoji].count += 1;
    if (String(r.userId) === String(myId)) map[r.emoji].mine = true;
  });
  return map;
};

/**
 * A single chat message or reply bubble.
 *
 * On hover (or focus) it reveals three actions: react with an emoji, reply
 * (messages only), and report. It also shows like/dislike buttons and any
 * emoji-reaction chips. For root messages it renders the reply thread.
 */
export default function MessageBubble({
  message,
  variant = 'message',
  myUsername,
  myId,
  myReactions = {},
  onReact,
  onEmoji,
  onReport,
  // message-only props:
  replies = [],
  repliesOpen = false,
  repliesLoading = false,
  onToggleReplies,
  onSendReply,
}) {
  const isReply = variant === 'reply';
  const targetType = isReply ? 'reply' : 'message';
  const isOwn = message.anonymousUsername === myUsername;

  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  const grouped = groupReactions(message.reactions, myId);
  const myReaction = myReactions[message._id];

  const sendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendReply(message._id, replyText.trim());
    setReplyText('');
    setShowReplyBox(false);
  };

  return (
    <div className={`msg-row flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-pop-in`}>
      <div className={`chat ${isOwn ? 'chat-end' : 'chat-start'} w-full`}>
        {/* Avatar */}
        <div className="chat-image avatar avatar-placeholder">
          <div
            className={`w-9 rounded-full ${
              isOwn ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'
            }`}
          >
            <span className="text-sm">{message.anonymousUsername?.[0]?.toUpperCase()}</span>
          </div>
        </div>

        {/* Header */}
        <div className="chat-header text-xs opacity-70 mb-0.5">
          {message.anonymousUsername}
          <time className="ml-2 opacity-50">{formatTime(message.createdAt)}</time>
        </div>

        {/* Bubble + hover actions */}
        <div className={`chat-bubble ${isOwn ? 'chat-bubble-primary' : ''} ${isReply ? 'text-sm' : ''} relative`}>
          {message.content}

          {/* Hover action toolbar */}
          <div
            className={`msg-actions absolute -top-3 ${
              isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
            } flex items-center gap-1`}
          >
            <div className="join bg-base-100 rounded-full shadow-md border border-base-200">
              {/* Emoji react (dropdown popover) */}
              <div className="dropdown dropdown-top">
                <button
                  tabIndex={0}
                  className="btn btn-ghost btn-xs join-item"
                  title="React"
                  aria-label="React with emoji"
                >
                  <EmojiIcon />
                </button>
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 rounded-2xl shadow-lg border border-base-200 p-1 flex gap-0.5 mb-1 z-30"
                >
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      className="btn btn-ghost btn-xs text-base px-1.5 hover:scale-125 transition"
                      onClick={() => onEmoji(targetType, message._id, em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply (messages only) */}
              {!isReply && (
                <button
                  className="btn btn-ghost btn-xs join-item"
                  title="Reply"
                  aria-label="Reply"
                  onClick={() => setShowReplyBox((v) => !v)}
                >
                  <ReplyIcon />
                </button>
              )}

              {/* Report */}
              <button
                className="btn btn-ghost btn-xs join-item text-error/80"
                title="Report"
                aria-label="Report"
                onClick={() => onReport({ contentType: targetType, contentId: message._id })}
              >
                <FlagIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Footer: like/dislike + emoji chips */}
        <div className="chat-footer mt-1 flex flex-wrap items-center gap-1">
          <button
            className={`btn btn-xs rounded-full gap-1 ${
              myReaction === 'like' ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={() => onReact(targetType, message._id, myReaction === 'like' ? 'none' : 'like')}
          >
            <ThumbUpIcon /> {message.likeCount || 0}
          </button>
          <button
            className={`btn btn-xs rounded-full gap-1 ${
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
              className={`btn btn-xs rounded-full ${mine ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => onEmoji(targetType, message._id, emoji)}
            >
              {emoji} {count}
            </button>
          ))}

          {!isReply && (
            <button
              className="btn btn-ghost btn-xs rounded-full gap-1 opacity-70"
              onClick={() => onToggleReplies(message._id)}
            >
              <ReplyIcon />
              {replies.length > 0 ? `${replies.length} repl${replies.length > 1 ? 'ies' : 'y'}` : 'Reply'}
            </button>
          )}
        </div>
      </div>

      {/* Inline reply composer */}
      {!isReply && showReplyBox && (
        <form onSubmit={sendReply} className="flex gap-2 w-full max-w-md mt-1 mb-1 self-start ml-12">
          <input
            autoFocus
            className="input input-bordered input-sm rounded-full flex-1"
            placeholder={`Reply to ${message.anonymousUsername}…`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm btn-circle">
            <SendIcon />
          </button>
        </form>
      )}

      {/* Reply thread */}
      {!isReply && repliesOpen && (
        <div className="w-full pl-8 sm:pl-12 border-l-2 border-base-300 ml-4 mt-1 flex flex-col gap-2">
          {repliesLoading && (
            <span className="loading loading-dots loading-sm text-primary self-start" />
          )}
          {replies.map((r) => (
            <MessageBubble
              key={r._id}
              message={r}
              variant="reply"
              myUsername={myUsername}
              myId={myId}
              myReactions={myReactions}
              onReact={onReact}
              onEmoji={onEmoji}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
