import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchPosts, createPost, reactToPost } from '../../features/posts/postsSlice';
import Loader from '../Loader';
import { ThumbUpIcon, ThumbDownIcon } from '../icons';
import { uploadMedia } from '../../lib/media';
import { POST_TAGS, PostMedia } from './PostCommentSection';

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

/** Reddit-style posts feed. Post titles link to a full-page thread view. */
export default function PostsTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const community = useSelector((s) =>
    s.communities.list.find((c) => c._id === communityId) || s.communities.current
  );
  const bucket = useSelector((s) => s.posts.byCommunity[communityId]);

  const [sort, setSort] = useState('new');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', tag: 'Humour' });
  const [mediaFile, setMediaFile] = useState(null);

  useEffect(() => {
    dispatch(fetchPosts({ communityId, sort }));
  }, [dispatch, communityId, sort]);

  const submitPost = async (e) => {
    e.preventDefault();
    let media;
    if (mediaFile) media = await uploadMedia(mediaFile);
    await dispatch(createPost({ communityId, payload: { ...form, media } }));
    setCreateOpen(false);
    setForm({ title: '', content: '', tag: 'Humour' });
    setMediaFile(null);
    dispatch(fetchPosts({ communityId, sort }));
  };

  const posts = bucket?.posts || [];
  const loading = bucket?.status === 'loading';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-bold text-lg">Posts</h1>
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
            className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition"
          >
            <div className="card-body p-0 flex-row gap-0">
              <div className="p-3">
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
                <Link
                  to={`/c/${encodeURIComponent(communityId)}/posts/${p._id}`}
                  className="font-bold text-base mt-1 link link-hover text-left block"
                >
                  {p.title}
                </Link>
                <p className="text-sm text-base-content/80 line-clamp-3 mt-1">{p.content}</p>
                <PostMedia media={p.media} />
                <Link
                  to={`/c/${encodeURIComponent(communityId)}/posts/${p._id}`}
                  className="text-xs text-base-content/40 mt-2 link link-hover inline-block"
                >
                  {p.commentCount || 0} comments
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {createOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-3xl max-w-lg">
            <h3 className="font-bold text-lg">Create a post</h3>
            <p className="text-xs text-base-content/50 mt-1">
              Posts are reviewed by a moderator before they appear in the feed.
            </p>
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
              <select
                className="select select-bordered rounded-2xl"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                required
              >
                {POST_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept="image/*,video/*"
                className="file-input file-input-bordered rounded-2xl w-full"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
              <div className="modal-action">
                <button type="button" className="btn btn-ghost rounded-2xl" onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary rounded-2xl">
                  Submit for review
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setCreateOpen(false)} />
        </div>
      )}
    </div>
  );
}
