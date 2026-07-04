/**
 * MODERATOR SLICE
 * ----------------------------------------------------------------------------
 * Backs the moderator dashboard. Provides thunks for every moderator action:
 *   - Searching/listing all communities (with filters)
 *   - Looking up users and their content
 *   - Managing the reports queue (fetch + resolve)
 *   - Managing the user-requests queue (fetch + resolve)
 *   - Banning/unbanning users
 *   - CRUD on communities (create, update, delete, delete-all, delete-all-course)
 *   - Adding members to a community
 *   - Deleting any content (posts, comments, messages, events)
 *   - Approving/rejecting pending posts and events
 *
 * Every thunk hits the protected /moderator/* API which requires moderator role.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch all communities (moderator view): GET /moderator/communities
 * Supports search, type, and category filters. Abortable via signal.
 * @param {{ search?: string, type?: string, category?: string }} filters
 * @returns {Array<Object>} Array of community objects.
 */
export const modFetchCommunities = createAsyncThunk(
  'mod/communities',
  async (filters = {}, { rejectWithValue, signal }) => {
    try {
      const { search = '', type = 'all', category = 'all' } = filters;
      const params = {};
      if (search) params.search = search;
      if (type && type !== 'all') params.type = type;
      if (category && category !== 'all') params.category = category;
      const { data } = await api.get('/moderator/communities', { params, signal });
      return data.communities;
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return rejectWithValue('Request canceled.');
      }
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Look up a user by email or username: GET /moderator/users/:identifier
 * @param {string} identifier - Email or username.
 * @returns {{ user: Object, posts: Array, comments: Array, messages: Array }}
 */
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

/**
 * Fetch content reports: GET /moderator/reports
 * @param {string} status - Filter: 'pending' | 'resolved'.
 * @returns {Array<Object>} Array of report objects.
 */
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

/**
 * Resolve a report: POST /moderator/reports/:id/resolve
 * @param {{ id: string, action: string }} params - Report ID and resolution action.
 * @returns {string} The resolved report's ID.
 */
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

/**
 * Fetch user requests (e.g. community creation requests): GET /moderator/requests
 * @param {string} status - Filter: 'pending' | 'resolved'.
 * @returns {Array<Object>} Array of request objects.
 */
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

/**
 * Resolve a user request: POST /moderator/requests/:id/resolve
 * @param {{ id: string, action: string }} params
 * @returns {string} The resolved request's ID.
 */
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

/**
 * Ban or unban a user: PATCH /moderator/users/:id/ban
 * @param {{ id: string, banned: boolean }} params
 * @returns {Object} Updated user object (with isBanned field).
 */
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

/**
 * Update a community's settings: PATCH /moderator/communities/:id
 * @param {{ communityId: string, payload: Object }} params
 * @returns {Object} Updated community object.
 */
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

/**
 * Create a new community as moderator: POST /moderator/communities
 * @param {Object} payload - Community fields (name, type, category, etc.).
 * @returns {Object} The newly created community object.
 */
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

/**
 * Delete a single community: DELETE /moderator/communities/:id
 * @param {string} communityId
 * @returns {{ communityId: string, message: string }}
 */
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

/**
 * Delete all course-type communities: DELETE /moderator/communities/course
 * @returns {{ message: string, deletedCommunities: Array }}
 */
export const modDeleteAllCourseCommunities = createAsyncThunk(
  'mod/deleteAllCourseCommunities',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete('/moderator/communities/course');
      return {
        message: data.message,
        deletedCommunities: data.deletedCommunities,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Delete ALL communities: DELETE /moderator/communities/all
 * @returns {{ message: string, deletedCommunities: Array }}
 */
export const modDeleteAllCommunities = createAsyncThunk(
  'mod/deleteAllCommunities',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete('/moderator/communities/all');
      return { message: data.message, deletedCommunities: data.deletedCommunities };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Add a user to a community: POST /moderator/communities/:id/members
 * @param {{ communityId: string, userId: string }} params
 * @returns {{ communityId, message, community }}
 */
export const modAddCommunityMember = createAsyncThunk(
  'mod/addCommunityMember',
  async ({ communityId, userId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/moderator/communities/${encodeURIComponent(communityId)}/members`,
        { userId }
      );
      return { communityId, message: data.message, community: data.community };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Delete any piece of content: DELETE /moderator/:kind/:id
 * @param {{ kind: 'posts'|'comments'|'messages'|'events', id: string }} params
 * @returns {{ kind, id, message }}
 */
export const modDeleteContent = createAsyncThunk(
  'mod/deleteContent',
  async ({ kind, id }, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/moderator/${kind}/${id}`);
      return { kind, id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch posts awaiting moderation: GET /moderator/posts
 * @param {{ status?: string, search?: string }} params
 * @returns {Array<Object>} Pending/reviewed post objects.
 */
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

/**
 * Approve a pending post: POST /moderator/posts/:id/approve
 * @param {string} id - Post ID.
 * @returns {{ id, message }}
 */
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

/**
 * Reject a pending post: POST /moderator/posts/:id/reject
 * @param {string} id - Post ID.
 * @returns {{ id, message }}
 */
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

/**
 * Fetch events awaiting moderation: GET /moderator/events
 * @param {{ status?: string, search?: string }} params
 * @returns {Array<Object>} Pending/reviewed event objects.
 */
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

/**
 * Approve a pending event with an optional tag: POST /moderator/events/:id/approve
 * @param {{ id: string, tag?: string }} params
 * @returns {{ id, message }}
 */
export const modApproveEvent = createAsyncThunk(
  'mod/approveEvent',
  async ({ id, tag }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/moderator/events/${id}/approve`, { tag });
      return { id, message: data.message };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Reject a pending event: POST /moderator/events/:id/reject
 * @param {string} id - Event ID.
 * @returns {{ id, message }}
 */
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

// --- Slice ----------------------------------------------------------------

const moderatorSlice = createSlice({
  name: 'moderator',
  initialState: {
    /** Communities returned by the moderator search/list. */
    communities: [],
    /** Result of a user lookup (user + their content). */
    userLookup: null,
    /** Content reports queue. */
    reports: [],
    /** User requests queue (e.g. community creation requests). */
    requests: [],
    /** Posts awaiting moderator approval. */
    pendingPosts: [],
    /** Events awaiting moderator approval. */
    pendingEvents: [],
    /** General async status. */
    status: 'idle',
    /** Most recent error message. */
    error: null,
    /** Transient success notice for the UI. */
    notice: null,
  },
  reducers: {
    /** Clear both error and notice messages. */
    clearModMessages(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Community management ---
      // Fetched communities list replaces the current list.
      .addCase(modFetchCommunities.fulfilled, (state, action) => {
        state.communities = action.payload;
      })
      // Updated community replaces its entry in the list.
      .addCase(modUpdateCommunity.fulfilled, (state, action) => {
        const i = state.communities.findIndex((c) => c._id === action.payload._id);
        if (i >= 0) state.communities[i] = action.payload;
      })
      // New community prepended to the list.
      .addCase(modCreateCommunity.fulfilled, (state, action) => {
        state.communities = [action.payload, ...state.communities];
        state.notice = 'Community created.';
      })
      // Single community removed from list.
      .addCase(modDeleteCommunity.fulfilled, (state, action) => {
        state.communities = state.communities.filter((c) => c._id !== action.payload.communityId);
        state.notice = action.payload.message || 'Community deleted.';
      })
      // All communities wiped.
      .addCase(modDeleteAllCommunities.fulfilled, (state, action) => {
        state.communities = [];
        state.notice = action.payload.message || 'All communities deleted.';
      })
      // All course communities removed.
      .addCase(modDeleteAllCourseCommunities.fulfilled, (state, action) => {
        state.communities = state.communities.filter((c) => c.type !== 'course');
        state.notice = action.payload.message || 'All course communities deleted.';
      })
      // Member added to a community — update the community object in the list.
      .addCase(modAddCommunityMember.fulfilled, (state, action) => {
        const i = state.communities.findIndex((c) => c._id === action.payload.communityId);
        if (i >= 0) state.communities[i] = action.payload.community;
        state.notice = action.payload.message || 'User added.';
      })

      // --- User lookup ---
      .addCase(modLookupUser.fulfilled, (state, action) => {
        state.userLookup = action.payload;
      })

      // --- Reports queue ---
      .addCase(modFetchReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      // Resolved report removed from the queue.
      .addCase(modResolveReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter((r) => r._id !== action.payload);
        state.notice = 'Report resolved.';
      })

      // --- Requests queue ---
      .addCase(modFetchRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
      })
      // Resolved request removed from the queue.
      .addCase(modResolveRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter((r) => r._id !== action.payload);
        state.notice = 'Request handled.';
      })

      // --- User ban/unban ---
      .addCase(modBanUser.fulfilled, (state, action) => {
        state.userLookup = state.userLookup
          ? { ...state.userLookup, user: action.payload }
          : state.userLookup;
        state.notice = action.payload.isBanned ? 'User banned.' : 'User unbanned.';
      })

      // --- Content deletion ---
      // Removes from the appropriate pending list (posts or events).
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

      // --- Pending posts ---
      .addCase(modFetchPendingPosts.fulfilled, (state, action) => {
        state.pendingPosts = action.payload;
      })
      // Approved post removed from pending queue.
      .addCase(modApprovePost.fulfilled, (state, action) => {
        state.pendingPosts = state.pendingPosts.filter((p) => p._id !== action.payload.id);
        state.notice = action.payload.message || 'Post approved.';
      })
      // Rejected post removed from pending queue.
      .addCase(modRejectPost.fulfilled, (state, action) => {
        state.pendingPosts = state.pendingPosts.filter((p) => p._id !== action.payload.id);
        state.notice = action.payload.message || 'Post rejected.';
      })

      // --- Pending events ---
      .addCase(modFetchPendingEvents.fulfilled, (state, action) => {
        state.pendingEvents = action.payload;
      })
      // Approved event removed from pending queue.
      .addCase(modApproveEvent.fulfilled, (state, action) => {
        state.pendingEvents = state.pendingEvents.filter((e) => e._id !== action.payload.id);
        state.notice = action.payload.message || 'Event approved.';
      })
      // Rejected event removed from pending queue.
      .addCase(modRejectEvent.fulfilled, (state, action) => {
        state.pendingEvents = state.pendingEvents.filter((e) => e._id !== action.payload.id);
        state.notice = action.payload.message || 'Event rejected.';
      })

      // --- Generic error handler for any rejected mod/ action ---
      // Silently ignores cancellation errors from aborted requests.
      .addMatcher(
        (action) => action.type.startsWith('mod/') && action.type.endsWith('/rejected'),
        (state, action) => {
          if (action.payload === 'Request canceled.') return;
          state.error = action.payload || 'Action failed.';
        }
      );
  },
});

export const { clearModMessages } = moderatorSlice.actions;
export default moderatorSlice.reducer;
