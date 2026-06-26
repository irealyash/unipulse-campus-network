import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createComment, reactToComment } from '../../features/posts/postsSlice';
import { ThumbUpIcon, ThumbDownIcon, CloseIcon, GifIcon } from '../icons';
import GifPicker from '../chat/GifPicker';

export const POST_TAGS = ['Humour', 'Angry', 'Confession'];

function CommentMedia({ media }) {
  if (!media?.url) return null;
  if (media.mediaType === 'video') {
    return <video src={media.url} controls className="rounded-xl max-h-48 mt-2 w-full" />;
  }
  return <img src={media.url} alt="" className="rounded-xl max-h-48 mt-2 object-contain" />;
}

function VoteColumn({ score, onLike, onDislike }) {
  return (
    <div className="flex flex-col items-center gap-0.5 pt-1 text-base-content/60">
      <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onLike}>
        <ThumbUpIcon />
      </button>
      <span className="text-sm font-bold">{score ?? 0}</span>
      <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={onDislike}>
        <ThumbDownIcon />
      </button>
    </div>
  );
}

function CommentTree({ comments, onReply, onReact, depth = 0 }) {
  if (!comments?.length) return null;
  return (
    <ul className={`space-y-3 ${depth ? 'ml-4 border-l-2 border-base-300 pl-3' : ''}`}>
      {comments.map((c) => (
        <li key={c._id}>
          <div className="flex gap-2">
            <VoteColumn
              score={c.score}
              onLike={() => onReact(c._id, 'like')}
              onDislike={() => onReact(c._id, 'dislike')}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-base-content/50">
                <span className="font-semibold text-primary">{c.anonymousUsername}</span> ·{' '}
                {new Date(c.createdAt).toLocaleString()}
              </p>
              {c.content && <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.content}</p>}
              <CommentMedia media={c.media} />
              <button type="button" className="btn btn-ghost btn-xs mt-1" onClick={() => onReply(c)}>
                Reply
              </button>
            </div>
          </div>
          <CommentTree comments={c.replies} onReply={onReply} onReact={onReact} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

/** Threaded comments + composer with GIF support and cancelable replies. */
export default function PostCommentSection({
  postId,
  comments,
  commentSort,
  onSortChange,
  onRefresh,
  disabled = false,
}) {
  const dispatch = useDispatch();
  const [replyParent, setReplyParent] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [gifOpen, setGifOpen] = useState(false);

  const cancelReply = () => setReplyParent(null);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await dispatch(
      createComment({ postId, content: commentText, parentId: replyParent?._id || replyParent })
    );
    setCommentText('');
    setReplyParent(null);
    onRefresh?.();
  };

  const sendGif = async (url) => {
    await dispatch(
      createComment({
        postId,
        content: '',
        parentId: replyParent?._id || replyParent,
        media: { url, mediaType: 'gif' },
      })
    );
    setGifOpen(false);
    setReplyParent(null);
    onRefresh?.();
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
        onReact={(id, action) => dispatch(reactToComment({ commentId: id, action }))}
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

export function PostMedia({ media }) {
  if (!media?.url) return null;
  if (media.mediaType === 'video') {
    return <video src={media.url} controls className="rounded-xl max-h-96 mt-2 w-full" />;
  }
  return <img src={media.url} alt="" className="rounded-xl max-h-96 mt-2 object-contain" />;
}
