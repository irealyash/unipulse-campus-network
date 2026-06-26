import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

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
      return { communityId, post: data.post };
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

export const fetchComments = createAsyncThunk('posts/comments', async (postId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/posts/${postId}/comments`);
    return { postId, comments: data.comments };
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const createComment = createAsyncThunk(
  'posts/comment',
  async ({ postId, content, parentId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content, parentId });
      return { postId, comment: data.comment };
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
  },
  reducers: {
    clearCurrentPost(state) {
      state.currentPost = null;
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
        const { communityId, post } = action.payload;
        const bucket = state.byCommunity[communityId];
        if (bucket) bucket.posts = [post, ...bucket.posts];
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.currentPost = action.payload;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.commentsByPost[action.payload.postId] = action.payload.comments;
      })
      .addCase(reactToPost.fulfilled, (state, action) => {
        const { postId, post } = action.payload;
        if (state.currentPost?._id === postId) state.currentPost = post;
        Object.values(state.byCommunity).forEach((b) => {
          const i = b.posts?.findIndex((p) => p._id === postId);
          if (i >= 0) b.posts[i] = post;
        });
      });
  },
});

export const { clearCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;
