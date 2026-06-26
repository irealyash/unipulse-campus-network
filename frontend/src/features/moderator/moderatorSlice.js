import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/**
 * MODERATOR SLICE
 * ----------------------------------------------------------------------------
 * Backs the moderator tab: searching all communities, looking up users and
 * their content, the reports queue, the user-requests queue, banning, and
 * deleting any content. Every call here hits the protected /moderator/* API.
 */

export const modFetchCommunities = createAsyncThunk(
  'mod/communities',
  async (search = '', { rejectWithValue }) => {
    try {
      const { data } = await api.get('/moderator/communities', { params: { search } });
      return data.communities;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modLookupUser = createAsyncThunk(
  'mod/lookupUser',
  async (identifier, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/moderator/users/${encodeURIComponent(identifier)}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modFetchReports = createAsyncThunk(
  'mod/reports',
  async (status = 'pending', { rejectWithValue }) => {
    try {
      const { data } = await api.get('/moderator/reports', { params: { status } });
      return data.reports;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modResolveReport = createAsyncThunk(
  'mod/resolveReport',
  async ({ id, action }, { rejectWithValue }) => {
    try {
      await api.post(`/moderator/reports/${id}/resolve`, { action });
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modFetchRequests = createAsyncThunk(
  'mod/requests',
  async (status = 'pending', { rejectWithValue }) => {
    try {
      const { data } = await api.get('/moderator/requests', { params: { status } });
      return data.requests;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modResolveRequest = createAsyncThunk(
  'mod/resolveRequest',
  async ({ id, action }, { rejectWithValue }) => {
    try {
      await api.post(`/moderator/requests/${id}/resolve`, { action });
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modBanUser = createAsyncThunk(
  'mod/ban',
  async ({ id, banned }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/moderator/users/${id}/ban`, { banned });
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modUpdateCommunity = createAsyncThunk(
  'mod/updateCommunity',
  async ({ communityId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(
        `/moderator/communities/${encodeURIComponent(communityId)}`,
        payload
      );
      return data.community;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modCreateCommunity = createAsyncThunk(
  'mod/createCommunity',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/moderator/communities', payload);
      return data.community;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modDeleteCommunity = createAsyncThunk(
  'mod/deleteCommunity',
  async (communityId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/moderator/communities/${encodeURIComponent(communityId)}`);
      return { communityId, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modDeleteContent = createAsyncThunk(
  'mod/deleteContent',
  async ({ kind, id }, { rejectWithValue }) => {
    // kind: 'posts' | 'comments' | 'messages' | 'events'
    try {
      const { data } = await api.delete(`/moderator/${kind}/${id}`);
      return { kind, id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modFetchPendingPosts = createAsyncThunk(
  'mod/pendingPosts',
  async ({ status = 'pending', search = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/moderator/posts', { params: { status, search } });
      return data.posts;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modApprovePost = createAsyncThunk(
  'mod/approvePost',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/moderator/posts/${id}/approve`);
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modRejectPost = createAsyncThunk(
  'mod/rejectPost',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/moderator/posts/${id}/reject`);
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modFetchPendingEvents = createAsyncThunk(
  'mod/pendingEvents',
  async ({ status = 'pending', search = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/moderator/events', { params: { status, search } });
      return data.events;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modApproveEvent = createAsyncThunk(
  'mod/approveEvent',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/moderator/events/${id}/approve`);
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const modRejectEvent = createAsyncThunk(
  'mod/rejectEvent',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/moderator/events/${id}/reject`);
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const moderatorSlice = createSlice({
  name: 'moderator',
  initialState: {
    communities: [],
    userLookup: null,
    reports: [],
    requests: [],
    pendingPosts: [],
    pendingEvents: [],
    status: 'idle',
    error: null,
    notice: null,
  },
  reducers: {
    clearModMessages(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(modFetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
      })
      .addCase(modUpdateCommunity.fulfilled, (state, action) => {
        const i = state.communities.findIndex((c) => c._id === action.payload._id);
        if (i >= 0) state.communities[i] = action.payload;
      })
      .addCase(modCreateCommunity.fulfilled, (state, action) => {
        state.communities = [action.payload, ...state.communities];
        state.notice = 'Community created.';
      })
      .addCase(modDeleteCommunity.fulfilled, (state, action) => {
        state.communities = state.communities.filter((c) => c._id !== action.payload.communityId);
        state.notice = action.payload.message || 'Community deleted.';
      })
      .addCase(modLookupUser.fulfilled, (state, action) => {
        state.userLookup = action.payload;
      })
      .addCase(modFetchReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      .addCase(modResolveReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter((r) => r._id !== action.payload);
        state.notice = 'Report resolved.';
      })
      .addCase(modFetchRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
      })
      .addCase(modResolveRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter((r) => r._id !== action.payload);
        state.notice = 'Request handled.';
      })
      .addCase(modBanUser.fulfilled, (state, action) => {
        state.userLookup = state.userLookup
          ? { ...state.userLookup, user: action.payload }
          : state.userLookup;
        state.notice = action.payload.isBanned ? 'User banned.' : 'User unbanned.';
      })
      .addCase(modDeleteContent.fulfilled, (state, action) => {
        const { kind, id } = action.payload;
        if (kind === 'posts') {
          state.pendingPosts = state.pendingPosts.filter((p) => p._id !== id);
        }
        if (kind === 'events') {
          state.pendingEvents = state.pendingEvents.filter((e) => e._id !== id);
        }
        state.notice = action.payload.message || 'Content deleted.';
      })
      .addCase(modFetchPendingPosts.fulfilled, (state, action) => {
        state.pendingPosts = action.payload;
      })
      .addCase(modApprovePost.fulfilled, (state, action) => {
        state.pendingPosts = state.pendingPosts.filter((p) => p._id !== action.payload.id);
        state.notice = action.payload.message || 'Post approved.';
      })
      .addCase(modRejectPost.fulfilled, (state, action) => {
        state.pendingPosts = state.pendingPosts.filter((p) => p._id !== action.payload.id);
        state.notice = action.payload.message || 'Post rejected.';
      })
      .addCase(modFetchPendingEvents.fulfilled, (state, action) => {
        state.pendingEvents = action.payload;
      })
      .addCase(modApproveEvent.fulfilled, (state, action) => {
        state.pendingEvents = state.pendingEvents.filter((e) => e._id !== action.payload.id);
        state.notice = action.payload.message || 'Event approved.';
      })
      .addCase(modRejectEvent.fulfilled, (state, action) => {
        state.pendingEvents = state.pendingEvents.filter((e) => e._id !== action.payload.id);
        state.notice = action.payload.message || 'Event rejected.';
      })
      // Generic error capture for all moderator thunks.
      .addMatcher(
        (action) => action.type.startsWith('mod/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = action.payload || 'Action failed.';
        }
      );
  },
});

export const { clearModMessages } = moderatorSlice.actions;
export default moderatorSlice.reducer;
