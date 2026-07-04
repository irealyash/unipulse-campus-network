/**
 * POSTS SLICE
 * ----------------------------------------------------------------------------
 * Manages community forum posts, comments (threaded), and voting (like/dislike)
 * for both posts and comments. Posts are bucketed per community; comments are
 * stored per post in a nested tree structure. Supports optimistic updates for
 * votes and comment creation so the UI feels instant.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { applyOptimisticVote } from '../../lib/votes';

/**
 * Merge an updated post into every place it appears in state
 * (currentPost + every community bucket).
 * Preserves the existing myVote if the incoming data doesn't carry one.
 * @param {Object} state  - The posts slice state.
 * @param {string} postId - The post ID to update.
 * @param {Object} post   - Partial post fields to merge.
 */
const updatePostInState = (state, postId, post) => {
  const merge = (prev) => ({
    ...prev,
    ...post,
    myVote: post.myVote ?? prev.myVote,
  });

  if (state.currentPost?._id === postId) {
    state.currentPost = merge(state.currentPost);
  }
  Object.values(state.byCommunity).forEach((b) => {
    const i = b.posts?.findIndex((p) => p._id === postId);
    if (i >= 0) b.posts[i] = merge(b.posts[i]);
  });
};

/**
 * Recursively update a comment node in a nested reply tree.
 * @param {Array} nodes     - Current level of the comment tree.
 * @param {string} commentId - The target comment's ID.
 * @param {Object} patch     - Fields to merge into the matching comment.
 * @returns {Array} A new tree with the patched node.
 */
const updateCommentInTree = (nodes, commentId, patch) => {
  if (!nodes) return nodes;
  return nodes.map((n) => {
    if (n._id === commentId) {
      return { ...n, ...patch, myVote: patch.myVote ?? n.myVote };
    }
    return { ...n, replies: updateCommentInTree(n.replies, commentId, patch) };
  });
};

/**
 * Append a new comment to the correct location in the tree.
 * If parentId is null it's a top-level comment; otherwise it's nested under its parent.
 * @param {Array}  nodes    - Current tree.
 * @param {Object} comment  - The comment to insert.
 * @param {string|null} parentId - Parent comment ID, or null for root.
 * @returns {Array} Updated tree.
 */
const appendCommentToTree = (nodes, comment, parentId) => {
  if (!parentId) return [...(nodes || []), comment];
  return (nodes || []).map((n) => {
    if (n._id === parentId) {
      return { ...n, replies: [...(n.replies || []), comment] };
    }
    return { ...n, replies: appendCommentToTree(n.replies, comment, parentId) };
  });
};

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch paginated posts for a community: GET /communities/:id/posts
 * @param {{ communityId: string, sort?: string, page?: number }} params
 * @returns {{ communityId, posts, page, hasMore, total }}
 */
export const fetchPosts = createAsyncThunk(
  'posts/fetch',
  async ({ communityId, sort = 'new', page = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(communityId)}/posts`, {
        params: { sort, page },
      });
      return { communityId, sort, page, ...data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Create a new post in a community: POST /communities/:id/posts
 * Posts may require moderator approval before appearing.
 * @param {{ communityId: string, payload: Object }} params
 * @returns {{ communityId, post, message }}
 */
export const createPost = createAsyncThunk(
  'posts/create',
  async ({ communityId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/communities/${encodeURIComponent(communityId)}/posts`, payload);
      return { communityId, post: data.post, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch a single post by ID: GET /posts/:postId
 * @param {string} postId
 * @returns {Object} The full post object.
 */
export const fetchPost = createAsyncThunk('posts/one', async (postId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/${postId}`);
    return data.post;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Fetch comments for a post: GET /posts/:postId/comments
 * Returns a nested tree (replies embedded in their parent nodes).
 * @param {{ postId: string, sort?: string }} params
 * @returns {{ postId, comments: Array }}
 */
export const fetchComments = createAsyncThunk(
  'posts/comments',
  async ({ postId, sort = 'new' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/posts/${postId}/comments`, { params: { sort } });
      return { postId, comments: data.comments };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Create a comment on a post: POST /posts/:postId/comments
 * Supports top-level comments and threaded replies via parentId.
 * @param {{ postId: string, content: string, parentId?: string, media?: Object }} params
 * @returns {{ postId, comment, parentId }}
 */
export const createComment = createAsyncThunk(
  'posts/comment',
  async ({ postId, content, parentId, media }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content, parentId, media });
      return { postId, comment: data.comment, parentId: parentId || null };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Like/dislike a post: POST /posts/:postId/react
 * @param {{ postId: string, action: 'like'|'dislike'|'none' }} params
 * @returns {{ postId, post }} Updated post with new vote counts.
 */
export const reactToPost = createAsyncThunk(
  'posts/react',
  async ({ postId, action }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/posts/${postId}/react`, { action });
      return { postId, post: data.post };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Like/dislike a comment: POST /comments/:commentId/react
 * @param {{ commentId: string, action: 'like'|'dislike'|'none' }} params
 * @returns {{ commentId, comment }} Updated comment with new vote counts.
 */
export const reactToComment = createAsyncThunk(
  'posts/reactComment',
  async ({ commentId, action }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/comments/${commentId}/react`, { action });
      return { commentId, comment: data.comment };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- Slice ----------------------------------------------------------------

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    /** Posts bucketed by community ID → { posts, page, hasMore, total, status }. */
    byCommunity: {},
    /** The single post being viewed on the detail page. */
    currentPost: null,
    /** Comment trees bucketed by post ID → nested Array. */
    commentsByPost: {},
    /** General async status for post operations. */
    status: 'idle',
    /** Most recent error message. */
    error: null,
    /** Transient success notice (e.g. "Post submitted for approval"). */
    notice: null,
  },
  reducers: {
    /** Clear the detail-view post when navigating away. */
    clearCurrentPost(state) {
      state.currentPost = null;
    },
    /** Dismiss the success notice toast. */
    clearPostNotice(state) {
      state.notice = null;
    },
    /** Manually set a notice message. */
    showPostNotice(state, action) {
      state.notice = action.payload;
    },
    /** Remove a failed optimistic comment by its temporary ID. */
    removeOptimisticComment(state, action) {
      const { postId, tempId } = action.payload;
      const strip = (nodes) =>
        (nodes || [])
          .filter((n) => n._id !== tempId)
          .map((n) => ({ ...n, replies: strip(n.replies) }));
      state.commentsByPost[postId] = strip(state.commentsByPost[postId]);
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchPosts ---
      // Pending: initialize or mark the community's bucket as loading.
      .addCase(fetchPosts.pending, (state, action) => {
        const cid = action.meta.arg.communityId;
        state.byCommunity[cid] = state.byCommunity[cid] || { posts: [], status: 'loading' };
        state.byCommunity[cid].status = 'loading';
      })
      // Fulfilled: replace (page 1) or append (page 2+) posts into the bucket.
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const { communityId, posts, page, hasMore, total } = action.payload;
        const prev = state.byCommunity[communityId]?.posts || [];
        state.byCommunity[communityId] = {
          posts: page > 1 ? [...prev, ...posts] : posts,
          page,
          hasMore,
          total,
          status: 'succeeded',
        };
      })

      // --- createPost ---
      // Only auto-approved posts are added to the list immediately.
      .addCase(createPost.fulfilled, (state, action) => {
        const { communityId, post, message } = action.payload;
        state.notice = message || 'Post submitted for moderator approval.';
        if (post?.status === 'approved') {
          const bucket = state.byCommunity[communityId];
          if (bucket) bucket.posts = [post, ...bucket.posts];
        }
      })

      // --- fetchPost (single) ---
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })

      // --- fetchComments ---
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsByPost[action.payload.postId] = action.payload.comments;
      })

      // --- createComment ---
      // Pending: insert an optimistic placeholder comment into the tree.
      .addCase(createComment.pending, (state, action) => {
        const { postId, content, parentId, media, optimisticId, username } = action.meta.arg;
        if (!optimisticId || !username) return;
        const optimistic = {
          _id: optimisticId,
          content: content || '',
          media: media || null,
          anonymousUsername: username,
          createdAt: new Date().toISOString(),
          parentId: parentId || null,
          score: 0,
          myVote: null,
          likeCount: 0,
          dislikeCount: 0,
          replies: [],
          pending: true,
        };
        state.commentsByPost[postId] = appendCommentToTree(
          state.commentsByPost[postId],
          optimistic,
          parentId || null
        );
      })
      // Fulfilled: replace the optimistic placeholder with the real comment.
      .addCase(createComment.fulfilled, (state, action) => {
        const { postId, comment, parentId } = action.payload;
        const tempId = action.meta.arg.optimisticId;
        let tree = state.commentsByPost[postId] || [];
        if (tempId) {
          const strip = (nodes) =>
            (nodes || [])
              .filter((n) => n._id !== tempId)
              .map((n) => ({ ...n, replies: strip(n.replies) }));
          tree = strip(tree);
        }
        state.commentsByPost[postId] = appendCommentToTree(tree, comment, parentId);
      })
      // Rejected: remove the optimistic placeholder on failure.
      .addCase(createComment.rejected, (state, action) => {
        const { postId, optimisticId } = action.meta.arg;
        if (!optimisticId) return;
        const strip = (nodes) =>
          (nodes || [])
            .filter((n) => n._id !== optimisticId)
            .map((n) => ({ ...n, replies: strip(n.replies) }));
        state.commentsByPost[postId] = strip(state.commentsByPost[postId]);
      })

      // --- reactToPost ---
      // Pending: apply optimistic vote so the UI reflects the change instantly.
      .addCase(reactToPost.pending, (state, action) => {
        const { postId, action: voteAction, userId } = action.meta.arg;
        if (!userId) return;

        const patch = (post) => applyOptimisticVote(post, voteAction, userId);

        if (state.currentPost?._id === postId) {
          state.currentPost = patch(state.currentPost);
        }
        Object.values(state.byCommunity).forEach((b) => {
          const i = b.posts?.findIndex((p) => p._id === postId);
          if (i >= 0) b.posts[i] = patch(b.posts[i]);
        });
      })
      // Fulfilled: reconcile with the server-confirmed vote counts.
      .addCase(reactToPost.fulfilled, (state, action) => {
        const { postId, post } = action.payload;
        updatePostInState(state, postId, post);
      })

      // --- reactToComment ---
      // Pending: optimistic vote on a comment across all post trees.
      .addCase(reactToComment.pending, (state, action) => {
        const { commentId, action: voteAction, userId } = action.meta.arg;
        if (!userId) return;
        Object.keys(state.commentsByPost).forEach((postId) => {
          const patchTree = (nodes) =>
            (nodes || []).map((n) => {
              if (n._id === commentId) return applyOptimisticVote(n, voteAction, userId);
              return { ...n, replies: patchTree(n.replies) };
            });
          state.commentsByPost[postId] = patchTree(state.commentsByPost[postId]);
        });
      })
      // Fulfilled: reconcile comment with server data.
      .addCase(reactToComment.fulfilled, (state, action) => {
        const { commentId, comment } = action.payload;
        Object.keys(state.commentsByPost).forEach((postId) => {
          state.commentsByPost[postId] = updateCommentInTree(
            state.commentsByPost[postId],
            commentId,
            comment
          );
        });
      });
  },
});

export const { clearCurrentPost, clearPostNotice, showPostNotice, removeOptimisticComment } = postsSlice.actions;
export default postsSlice.reducer;
