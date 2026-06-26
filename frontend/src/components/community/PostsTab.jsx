import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  fetchPosts,
  createPost,
  fetchPost,
  fetchComments,
  createComment,
  reactToPost,
  reactToComment,
  clearCurrentPost,
} from '../../features/posts/postsSlice';
import Loader from '../Loader';
import { ThumbUpIcon, ThumbDownIcon, CloseIcon } from '../icons';

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
              <p className="text-sm mt-0.5">{c.content}</p>
              <button
                type="button"
                className="btn btn-ghost btn-xs mt-1"
                onClick={() => onReply(c._id)}
              >
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

/** Reddit-style posts feed + thread modal. */
export default function PostsTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );
  const bucket = useSelector((s) => s.posts.byCommunity[communityId]);
  const currentPost = useSelector((s) => s.posts.currentPost);
  const comments = useSelector((s) => s.posts.commentsByPost[currentPost?._id]);

  const [sort, setSort] = useState('new');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tag: 'general' });
  const [replyParent, setReplyParent] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    dispatch(fetchPosts({ communityId, sort }));
  }, [dispatch, communityId, sort]);

  const openPost = (postId) => {
    dispatch(fetchPost(postId));
    dispatch(fetchComments(postId));
  };

  const closePost = () => dispatch(clearCurrentPost());

  const submitPost = async (e) => {
    e.preventDefault();
    await dispatch(createPost({ communityId, payload: form }));
    setCreateOpen(false);
    setForm({ title: '', content: '', tag: 'general' });
    dispatch(fetchPosts({ communityId, sort }));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await dispatch(
      createComment({ postId: currentPost._id, content: commentText, parentId: replyParent })
    );
    setCommentText('');
    setReplyParent(null);
    dispatch(fetchComments(currentPost._id));
  };

  const posts = bucket?.posts || [];
  const loading = bucket?.status === 'loading';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Subreddit-style header */}
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-bold text-lg">r/{communityId}</h1>
          <p className="text-xs text-base-content/50">{community?.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div role="tablist" className="tabs tabs-box tabs-sm">
            <button
              type="button"
              role="tab"
              className={`tab ${sort === 'new' ? 'tab-active' : ''}`}
              onClick={() => setSort('new')}
            >
              New
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${sort === 'top' ? 'tab-active' : ''}`}
              onClick={() => setSort('top')}
            >
              Top
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm rounded-full" onClick={() => setCreateOpen(true)}>
            Create Post
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200/30 min-h-0">
        {loading && <Loader label="Loading posts…" />}
        {!loading && posts.length === 0 && (
          <div className="card bg-base-100 border border-dashed border-base-300">
            <div className="card-body items-center text-center text-base-content/50">
              <p>No posts yet. Start the conversation!</p>
            </div>
          </div>
        )}
        {posts.map((p) => (
          <article
            key={p._id}
            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => openPost(p._id)}
          >
            <div className="card-body p-0 flex-row gap-0">
              <div className="p-3" onClick={(e) => e.stopPropagation()}>
                <VoteColumn
                  score={p.score}
                  onLike={() => dispatch(reactToPost({ postId: p._id, action: 'like' }))}
                  onDislike={() => dispatch(reactToPost({ postId: p._id, action: 'dislike' }))}
                />
              </div>
              <div className="flex-1 py-3 pr-4 min-w-0">
                <p className="text-xs text-base-content/50">
                  Posted by <span className="font-medium text-primary">{p.anonymousUsername}</span> ·{' '}
                  {new Date(p.createdAt).toLocaleDateString()}
                  {p.tag && <span className="badge badge-outline badge-xs ml-2">{p.tag}</span>}
                </p>
                <h2 className="font-bold text-base mt-1">{p.title}</h2>
                <p className="text-sm text-base-content/80 line-clamp-3 mt-1">{p.content}</p>
                <p className="text-xs text-base-content/40 mt-2">{p.commentCount || 0} comments</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create post modal */}
      {createOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg">
            <h3 className="font-bold text-lg">Create a post</h3>
            <form onSubmit={submitPost} className="flex flex-col gap-3 mt-3">
              <input
                className="input input-bordered rounded-2xl"
                placeholder="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered rounded-2xl min-h-28"
                placeholder="What's on your mind?"
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              {community?.allowedTags?.length > 1 && (
                <select
                  className="select select-bordered rounded-2xl"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                >
                  {community.allowedTags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
              <div className="modal-action">
                <button type="button" className="btn btn-ghost rounded-2xl" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Post
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setCreateOpen(false)} />
        </div>
      )}

      {/* Post detail modal (thread) */}
      {currentPost && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-2xl max-h-[90vh] flex flex-col p-0">
            <div className="p-4 border-b border-base-200 flex justify-between items-start">
              <div>
                <p className="text-xs text-base-content/50">
                  u/{currentPost.anonymousUsername} · {new Date(currentPost.createdAt).toLocaleString()}
                </p>
                <h3 className="font-bold text-xl mt-1">{currentPost.title}</h3>
              </div>
              <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={closePost}>
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm whitespace-pre-wrap">{currentPost.content}</p>
              <div className="divider" />
              <CommentTree
                comments={comments}
                onReply={(id) => setReplyParent(id)}
                onReact={(id, action) => dispatch(reactToComment({ commentId: id, action }))}
              />
            </div>
            <form onSubmit={submitComment} className="p-4 border-t border-base-200 flex gap-2">
              <input
                className="input input-bordered rounded-full flex-1 input-sm"
                placeholder={replyParent ? 'Write a reply…' : 'Add a comment…'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm rounded-full">
                Comment
              </button>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={closePost} />
        </div>
      )}
    </div>
  );
}
