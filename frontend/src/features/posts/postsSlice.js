import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { applyOptimisticVote } from '../../lib/votes';

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

const updateCommentInTree = (nodes, commentId, patch) => {
  if (!nodes) return nodes;
  return nodes.map((n) => {
    if (n._id === commentId) {
      return { ...n, ...patch, myVote: patch.myVote ?? n.myVote };
    }
    return { ...n, replies: updateCommentInTree(n.replies, commentId, patch) };
  });
};

const appendCommentToTree = (nodes, comment, parentId) => {
  if (!parentId) return [...(nodes || []), comment];
  return (nodes || []).map((n) => {
    if (n._id === parentId) {
      return { ...n, replies: [...(n.replies || []), comment] };
    }
    return { ...n, replies: appendCommentToTree(n.replies, comment, parentId) };
  });
};

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

export const fetchPost = createAsyncThunk('posts/one', async (postId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/${postId}`);
    return data.post;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

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

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    byCommunity: {},
    currentPost: null,
    commentsByPost: {},
    status: 'idle',
    error: null,
    notice: null,
  },
  reducers: {
    clearCurrentPost(state) {
      state.currentPost = null;
    },
    clearPostNotice(state) {
      state.notice = null;
    },
    showPostNotice(state, action) {
      state.notice = action.payload;
    },
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
      .addCase(fetchPosts.pending, (state, action) => {
        const cid = action.meta.arg.communityId;
        state.byCommunity[cid] = state.byCommunity[cid] || { posts: [], status: 'loading' };
        state.byCommunity[cid].status = 'loading';
      })
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
      .addCase(createPost.fulfilled, (state, action) => {
        const { communityId, post, message } = action.payload;
        state.notice = message || 'Post submitted for moderator approval.';
        if (post?.status === 'approved') {
          const bucket = state.byCommunity[communityId];
          if (bucket) bucket.posts = [post, ...bucket.posts];
        }
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsByPost[action.payload.postId] = action.payload.comments;
      })
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
      .addCase(createComment.rejected, (state, action) => {
        const { postId, optimisticId } = action.meta.arg;
        if (!optimisticId) return;
        const strip = (nodes) =>
          (nodes || [])
            .filter((n) => n._id !== optimisticId)
            .map((n) => ({ ...n, replies: strip(n.replies) }));
        state.commentsByPost[postId] = strip(state.commentsByPost[postId]);
      })
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
      .addCase(reactToPost.fulfilled, (state, action) => {
        const { postId, post } = action.payload;
        updatePostInState(state, postId, post);
      })
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
