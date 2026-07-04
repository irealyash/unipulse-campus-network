/**
 * PostCommentSection — threaded comments UI for a single post.
 *
 * Renders a recursive comment tree with voting, replies, GIF support,
 * and report buttons. Also exports VoteColumn, PostMedia, and POST_TAGS
 * for use by PostsTab and other post-related components.
 *
 * Used inside the full-post thread view page.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createComment, reactToComment } from '../../features/posts/postsSlice';
import { ThumbUpIcon, ThumbDownIcon, CloseIcon, GifIcon } from '../icons';
import GifPicker from '../chat/GifPicker';
import ReportFlagButton from '../ReportFlagButton';
import { EventMediaCarousel } from './EventParts';

// Available tags when creating a post
export const POST_TAGS = [
  'General',
  'Discussion',
  'Question',
  'Life Sucks',
  'Humour',
  'Angry',
  'Confession',
];

/** Renders an image or video attached to a comment. */
function CommentMedia({ media }) {
  if (!media?.url) return null;
  if (media.mediaType === 'video') {
    return <video src={media.url} controls className="rounded-xl max-h-48 mt-2 w-full" />;
  }
  return <img src={media.url} alt="" className="rounded-xl max-h-48 mt-2 object-contain" />;
}

/**
 * VoteColumn — reusable up/down vote widget used in posts and comments.
 * @param {number}  score     — net vote score
 * @param {string}  myVote    — 'like' | 'dislike' | null
 * @param {Function} onLike   — handler for upvote click
 * @param {Function} onDislike— handler for downvote click
 * @param {boolean} horizontal— if true, render horizontally instead of vertically
 */
export function VoteColumn({ score, myVote, onLike, onDislike, horizontal = false }) {
  const btnClass = horizontal ? 'btn-sm' : 'btn-xs btn-square';

  return (
    <div
      className={`flex items-center text-base-content/60 ${
        horizontal ? 'flex-row gap-2' : 'flex-col gap-0.5 pt-1'
      }`}
    >
      <button
        type="button"
        className={`btn btn-ghost ${btnClass} ${myVote === 'like' ? 'text-primary bg-primary/10' : ''}`}
        onClick={onLike}
        aria-pressed={myVote === 'like'}
      >
        <ThumbUpIcon />
      </button>
      <span className={`font-bold ${horizontal ? 'text-base min-w-[1.5rem] text-center' : 'text-sm'}`}>
        {score ?? 0}
      </span>
      <button
        type="button"
        className={`btn btn-ghost ${btnClass} ${myVote === 'dislike' ? 'text-error bg-error/10' : ''}`}
        onClick={onDislike}
        aria-pressed={myVote === 'dislike'}
      >
        <ThumbDownIcon />
      </button>
    </div>
  );
}

// Local alias avoids Fast Refresh issues with re-exported components
function VoteColumnLocal(props) {
  return <VoteColumn {...props} />;
}

// Recursively count all nested replies under a comment
function countReplies(replies) {
  if (!replies?.length) return 0;
  return replies.reduce((n, r) => n + 1 + countReplies(r.replies), 0);
}

/** Single comment with vote controls, reply button, and collapsible child thread. */
function CommentItem({ comment, onReply, onReact, onReport, depth = 0 }) {
  // Whether the nested replies are expanded
  const [showReplies, setShowReplies] = useState(false);
  const directReplies = comment.replies?.length || 0;
  const totalReplies = countReplies(comment.replies);

  return (
    <li>
      <div className="flex gap-2">
        <VoteColumnLocal
          score={comment.score}
          myVote={comment.myVote}
          onLike={() => onReact(comment._id, comment.myVote === 'like' ? 'none' : 'like')}
          onDislike={() => onReact(comment._id, comment.myVote === 'dislike' ? 'none' : 'dislike')}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-base-content/50 flex flex-wrap items-center gap-1">
            <span className="font-semibold text-primary">{comment.anonymousUsername}</span>
            <span>· {new Date(comment.createdAt).toLocaleString()}</span>
            {onReport && (
              <ReportFlagButton
                onClick={() =>
                  onReport({
                    contentType: comment.parentId ? 'reply' : 'comment',
                    contentId: comment._id,
                  })
                }
              />
            )}
          </p>
          {comment.content && <p className="text-sm mt-0.5 whitespace-pre-wrap">{comment.content}</p>}
          <CommentMedia media={comment.media} />
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => onReply(comment)}>
              Reply
            </button>
            {directReplies > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-xs text-primary"
                onClick={() => setShowReplies((v) => !v)}
              >
                {showReplies ? '▲ Hide' : '▼ View'} {totalReplies}{' '}
                {totalReplies === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>
      {showReplies && directReplies > 0 && (
        <div className="mt-2 ml-4 border-l-2 border-base-300 pl-3">
          <CommentTree comments={comment.replies} onReply={onReply} onReact={onReact} onReport={onReport} depth={depth + 1} />
        </div>
      )}
    </li>
  );
}

/** Recursive list of CommentItems — renders an arbitrarily deep thread. */
function CommentTree({ comments, onReply, onReact, onReport, depth = 0 }) {
  if (!comments?.length) return null;
  return (
    <ul className={`space-y-3 ${depth ? '' : ''}`}>
      {comments.map((c) => (
        <CommentItem
          key={c._id}
          comment={c}
          onReply={onReply}
          onReact={onReact}
          onReport={onReport}
          depth={depth}
        />
      ))}
    </ul>
  );
}

/**
 * PostCommentSection — threaded comments + composer with GIF support.
 *
 * Props:
 * @param {string}   postId       — the parent post id
 * @param {Array}    comments     — top-level comment objects with nested .replies
 * @param {string}   commentSort  — 'new' | 'top'
 * @param {Function} onSortChange — switch comment sort order
 * @param {Function} onRefresh    — re-fetch comments
 * @param {boolean}  disabled     — disable the comment composer
 * @param {Function} onReport     — open the report modal
 */
export default function PostCommentSection({
  postId,
  comments,
  commentSort,
  onSortChange,
  onRefresh,
  disabled = false,
  onReport,
}) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  // The comment being replied to (null = top-level comment)
  const [replyParent, setReplyParent] = useState(null);
  // Text in the comment composer input
  const [commentText, setCommentText] = useState('');
  // Whether the GIF picker popover is open
  const [gifOpen, setGifOpen] = useState(false);

  const cancelReply = () => setReplyParent(null);

  // Submit a text comment (optimistic + dispatches createComment thunk)
  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const parentId = replyParent?._id || replyParent || null;
    const text = commentText;
    const optimisticId = `temp-${Date.now()}`;
    setCommentText('');
    setReplyParent(null);
    await dispatch(
      createComment({
        postId,
        content: text,
        parentId,
        optimisticId,
        username: user?.username,
      })
    );
  };

  // Submit a GIF comment (no text, just media)
  const sendGif = async (url) => {
    const parentId = replyParent?._id || replyParent || null;
    const optimisticId = `temp-${Date.now()}`;
    setGifOpen(false);
    setReplyParent(null);
    await dispatch(
      createComment({
        postId,
        content: '',
        parentId,
        media: { url, mediaType: 'gif' },
        optimisticId,
        username: user?.username,
      })
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mt-6">
        <span className="text-sm font-semibold">Comments</span>
        <div role="tablist" className="tabs tabs-box tabs-xs">
          <button
            type="button"
            className={`tab ${commentSort === 'new' ? 'tab-active' : ''}`}
            onClick={() => onSortChange('new')}
          >
            New
          </button>
          <button
            type="button"
            className={`tab ${commentSort === 'top' ? 'tab-active' : ''}`}
            onClick={() => onSortChange('top')}
          >
            Top
          </button>
        </div>
      </div>
      <div className="divider" />
      <CommentTree
        comments={comments}
        onReply={(c) => setReplyParent(c)}
        onReact={(id, action) =>
          dispatch(reactToComment({ commentId: id, action, userId: user?.id }))
        }
        onReport={onReport}
      />

      {!disabled && (
        <div className="mt-4 border-t border-base-200 pt-4">
          {replyParent && (
            <div className="mb-2 rounded-lg overflow-hidden bg-base-300 border-l-[3px] border-primary">
              <div className="flex items-start gap-2 px-3 py-2">
                <div className="flex-1 min-w-0 text-sm">
                  <p className="text-primary font-semibold text-xs">
                    Replying to {replyParent.anonymousUsername}
                  </p>
                  <p className="text-base-content/60 truncate text-xs mt-0.5">
                    {replyParent.content || (replyParent.media?.url ? '[GIF]' : '')}
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-xs btn-circle shrink-0" onClick={cancelReply}>
                  <CloseIcon />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={submitComment} className="flex items-center gap-1">
            <input
              className="input input-bordered rounded-full flex-1 input-sm"
              placeholder={replyParent ? 'Write a reply…' : 'Add a comment…'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="relative shrink-0">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle shrink-0"
                onClick={() => setGifOpen((o) => !o)}
                title="Send a GIF"
              >
                <GifIcon />
              </button>
              <GifPicker open={gifOpen} onSelect={sendGif} onClose={() => setGifOpen(false)} />
            </div>
            {replyParent && (
              <button type="button" className="btn btn-ghost btn-sm rounded-full shrink-0" onClick={cancelReply}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm rounded-full shrink-0">
              {replyParent ? 'Reply' : 'Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * PostMedia — renders a post's media attachments using EventMediaCarousel.
 * Normalizes both array and single-object media formats.
 */
export function PostMedia({ media, compact = false, feed = false }) {
  let items = [];
  if (Array.isArray(media)) {
    items = media.filter((m) => m?.url);
  } else if (media?.url) {
    items = [{ url: media.url, mediaType: media.mediaType || 'image' }];
  }
  if (!items.length) return null;

  return <EventMediaCarousel items={items} compact={compact} feed={feed} />;
}
