/**
 * COMMUNITIES SLICE
 * ----------------------------------------------------------------------------
 * Manages the list of communities the current user can see (general + course
 * rooms), single-community detail views, the browsable catalog, and
 * join/leave membership actions. Also reacts to moderator delete actions
 * from the moderator slice so the user's list stays in sync.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { modDeleteCommunity, modDeleteAllCommunities, modDeleteAllCourseCommunities } from '../moderator/moderatorSlice';

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch all communities visible to the current user: GET /communities
 * Returns both joined catalog communities and enrolled course sections.
 * @returns {Array<Object>} Array of community objects.
 */
export const fetchCommunities = createAsyncThunk(
  'communities/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/communities');
      return data.communities;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch a single community's details: GET /communities/:id
 * @param {string} id - Community ID.
 * @returns {Object} The full community object.
 */
export const fetchCommunity = createAsyncThunk(
  'communities/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(id)}`);
      return data.community;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch the browsable community catalog: GET /communities/catalog
 * Filtered by category and optional search term.
 * @param {{ category: string, search?: string }} params
 * @returns {{ category: string, communities: Array<Object> }}
 */
export const fetchCatalog = createAsyncThunk(
  'communities/fetchCatalog',
  async ({ category, search = '' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/communities/catalog', {
        params: { category, search: search || undefined },
      });
      return { category, communities: data.communities };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Join a community: POST /users/me/joined-communities
 * @param {string|Object} community - Community ID string or full community object.
 * @returns {{ user: Object, community: Object, communityId: string }}
 */
export const joinCommunity = createAsyncThunk(
  'communities/join',
  async (community, { rejectWithValue }) => {
    const communityId = typeof community === 'string' ? community : community._id;
    try {
      const { data } = await api.post('/users/me/joined-communities', { communityId });
      return { ...data, communityId };
    } catch (err) {
      return rejectWithValue({ message: err.message, communityId });
    }
  }
);

/**
 * Leave a community: DELETE /users/me/joined-communities/:id
 * @param {string} communityId - The ID of the community to leave.
 * @returns {{ user: Object, communityId: string }}
 */
export const leaveCommunity = createAsyncThunk(
  'communities/leave',
  async (communityId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(
        `/users/me/joined-communities/${encodeURIComponent(communityId)}`
      );
      return { ...data, communityId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- Slice ----------------------------------------------------------------

const communitiesSlice = createSlice({
  name: 'communities',
  initialState: {
    /** All communities the user has access to (joined + course). */
    list: [],
    /** The currently-viewed community's full detail object. */
    current: null,
    /** Communities returned by the catalog browser. */
    catalog: [],
    /** Which catalog category is currently loaded. */
    catalogCategory: null,
    /** Async status for catalog fetches: 'idle' | 'loading' | 'succeeded' | 'failed'. */
    catalogStatus: 'idle',
    /** Async status for the main list fetch. */
    status: 'idle',
    /** Most recent error message. */
    error: null,
  },
  reducers: {
    /** Remove a single community from the list by ID; clear current if it matches. */
    removeCommunity(state, action) {
      const id = action.payload;
      state.list = state.list.filter((c) => c._id !== id);
      if (state.current?._id === id) state.current = null;
    },
    /** Wipe both the list and current community (e.g. on logout). */
    clearCommunities(state) {
      state.list = [];
      state.current = null;
    },
    /** Clear only the currently-viewed community detail. */
    clearCurrentCommunity(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchCommunities (main list) ---
      .addCase(fetchCommunities.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Always store an array — empty [] means "user has no communities" (valid).
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- fetchCommunity (single detail) ---
      .addCase(fetchCommunity.fulfilled, (state, action) => {
        state.current = action.payload;
        state.error = null;
      })
      .addCase(fetchCommunity.rejected, (state, action) => {
        state.error = action.payload;
      })

      // --- fetchCatalog (browsable catalog) ---
      .addCase(fetchCatalog.pending, (state) => {
        state.catalogStatus = 'loading';
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.catalogStatus = 'succeeded';
        state.catalog = action.payload.communities;
        state.catalogCategory = action.payload.category;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.catalogStatus = 'failed';
        state.error = action.payload;
      })

      // --- joinCommunity ---
      // Pending: optimistically push the community object into the list (if full object provided).
      .addCase(joinCommunity.pending, (state, action) => {
        const arg = action.meta.arg;
        const c = typeof arg === 'object' ? arg : null;
        if (c?._id && !state.list.some((x) => x._id === c._id)) {
          state.list.push(c);
        }
      })
      // Fulfilled: ensure the server-confirmed community is in the list.
      .addCase(joinCommunity.fulfilled, (state, action) => {
        const c = action.payload.community;
        if (c && !state.list.some((x) => x._id === c._id)) {
          state.list.push(c);
        }
      })
      // Rejected: roll back the optimistic addition.
      .addCase(joinCommunity.rejected, (state, action) => {
        const id = action.payload?.communityId;
        if (id) state.list = state.list.filter((c) => c._id !== id);
      })

      // --- leaveCommunity ---
      // Remove from list (but keep course communities, they are enrollment-based).
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        const id = action.payload.communityId;
        state.list = state.list.filter((c) => c._id !== id || c.type === 'course');
        if (state.current?._id === id) state.current = null;
      })

      // --- Cross-slice: moderator delete actions ---
      // Single community deleted by moderator.
      .addCase(modDeleteCommunity.fulfilled, (state, action) => {
        const id = action.payload.communityId;
        state.list = state.list.filter((c) => c._id !== id);
        if (state.current?._id === id) state.current = null;
      })
      // All communities wiped by moderator.
      .addCase(modDeleteAllCommunities.fulfilled, (state) => {
        state.list = [];
        state.current = null;
      })
      // All course communities wiped by moderator.
      .addCase(modDeleteAllCourseCommunities.fulfilled, (state) => {
        state.list = state.list.filter((c) => c.type !== 'course');
        if (state.current?.type === 'course') state.current = null;
      })
      .addMatcher(
        (action) => action.type === 'auth/logout',
        (state) => {
          state.list = [];
          state.current = null;
          state.catalog = [];
          state.catalogCategory = null;
          state.catalogStatus = 'idle';
          state.status = 'idle';
          state.error = null;
        }
      );
  },
});

export const { removeCommunity, clearCommunities, clearCurrentCommunity } = communitiesSlice.actions;
export default communitiesSlice.reducer;
