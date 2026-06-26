import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPost,
  fetchComments,
  reactToPost,
  clearCurrentPost,
} from '../features/posts/postsSlice';
import Loader from '../components/Loader';
import PostCommentSection, { PostMedia, VoteColumn } from '../components/community/PostCommentSection';
import ReportModal from '../components/chat/ReportModal';
import ReportFlagButton from '../components/ReportFlagButton';

/** Full-page view for a single post and its comment thread. */
export default function PostPage() {
  const { communityId, postId } = useParams();
  const dispatch = useDispatch();
  const post = useSelector((s) => s.posts.currentPost);
  const comments = useSelector((s) => s.posts.commentsByPost[postId]);
  const user = useSelector((s) => s.auth.user);
  const [commentSort, setCommentSort] = useState('new');
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchPost(postId));
    return () => dispatch(clearCurrentPost());
  }, [dispatch, postId]);

  useEffect(() => {
    if (post?._id) {
      dispatch(fetchComments({ postId: post._id, sort: commentSort }));
    }
  }, [dispatch, post?._id, commentSort]);

  const refreshComments = () => {
    if (post?._id) dispatch(fetchComments({ postId: post._id, sort: commentSort }));
  };

  if (!post || post._id !== postId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader label="Loading post…" />
      </div>
    );
  }

  const approved = post.status === 'approved' || !post.status;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 border-b border-base-200 bg-base-100 px-4 py-3">
        <Link
          to={`/c/${encodeURIComponent(communityId)}/posts`}
          className="text-sm text-primary link link-hover"
        >
          ← Back to posts
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-base-200/30 min-h-0">
        <article className="card bg-base-100 border border-base-200 shadow-sm max-w-3xl mx-auto">
          <div className="card-body">
            {post.status === 'pending' && (
              <div className="alert alert-warning text-sm py-2">
                This post is awaiting moderator approval. Comments will open once it is approved.
              </div>
            )}
            {post.status === 'rejected' && (
              <div className="alert alert-error text-sm py-2">
                This post was rejected by a moderator and is not visible in the community feed.
              </div>
            )}

            <p className="text-xs text-base-content/50 flex flex-wrap items-center gap-1">
              Posted by <span className="font-medium text-primary">{post.anonymousUsername}</span> ·{' '}
              {new Date(post.createdAt).toLocaleString()}
              {post.tag && <span className="badge badge-outline badge-xs">{post.tag}</span>}
              <ReportFlagButton
                onClick={() => setReportTarget({ contentType: 'post', contentId: post._id })}
              />
            </p>
            <h1 className="font-bold text-2xl mt-2">{post.title}</h1>
            <p className="text-sm whitespace-pre-wrap mt-3">{post.content}</p>
            <PostMedia media={post.media} />

            <div className="flex items-center gap-2 mt-4">
              <VoteColumn
                horizontal
                score={post.score}
                myVote={post.myVote}
                onLike={() =>
                  dispatch(
                    reactToPost({
                      postId: post._id,
                      action: post.myVote === 'like' ? 'none' : 'like',
                      userId: user?.id,
                    })
                  )
                }
                onDislike={() =>
                  dispatch(
                    reactToPost({
                      postId: post._id,
                      action: post.myVote === 'dislike' ? 'none' : 'dislike',
                      userId: user?.id,
                    })
                  )
                }
              />
            </div>

            <PostCommentSection
              postId={post._id}
              comments={comments}
              commentSort={commentSort}
              onSortChange={setCommentSort}
              onRefresh={refreshComments}
              disabled={!approved}
              onReport={setReportTarget}
            />
          </div>
        </article>
      </div>
      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
