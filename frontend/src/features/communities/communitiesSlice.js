import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { modDeleteCommunity, modDeleteAllCommunities, modDeleteAllCourseCommunities } from '../moderator/moderatorSlice';

/**
 * COMMUNITIES SLICE
 * ----------------------------------------------------------------------------
 * Loads the communities the current user can see (general + their course rooms)
 * and a single community's details.
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

const communitiesSlice = createSlice({
  name: 'communities',
  initialState: {
    list: [],
    current: null,
    catalog: [],
    catalogCategory: null,
    catalogStatus: 'idle',
    status: 'idle',
    error: null,
  },
  reducers: {
    removeCommunity(state, action) {
      const id = action.payload;
      state.list = state.list.filter((c) => c._id !== id);
      if (state.current?._id === id) state.current = null;
    },
    clearCommunities(state) {
      state.list = [];
      state.current = null;
    },
    clearCurrentCommunity(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunities.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchCommunity.fulfilled, (state, action) => {
        state.current = action.payload;
        state.error = null;
      })
      .addCase(fetchCommunity.rejected, (state, action) => {
        state.error = action.payload;
      })
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
      .addCase(joinCommunity.pending, (state, action) => {
        const arg = action.meta.arg;
        const c = typeof arg === 'object' ? arg : null;
        if (c?._id && !state.list.some((x) => x._id === c._id)) {
          state.list.push(c);
        }
      })
      .addCase(joinCommunity.fulfilled, (state, action) => {
        const c = action.payload.community;
        if (c && !state.list.some((x) => x._id === c._id)) {
          state.list.push(c);
        }
      })
      .addCase(joinCommunity.rejected, (state, action) => {
        const id = action.payload?.communityId;
        if (id) state.list = state.list.filter((c) => c._id !== id);
      })
      .addCase(leaveCommunity.fulfilled, (state, action) => {
        const id = action.payload.communityId;
        state.list = state.list.filter((c) => c._id !== id || c.type === 'course');
        if (state.current?._id === id) state.current = null;
      })
      .addCase(modDeleteCommunity.fulfilled, (state, action) => {
        const id = action.payload.communityId;
        state.list = state.list.filter((c) => c._id !== id);
        if (state.current?._id === id) state.current = null;
      })
      .addCase(modDeleteAllCommunities.fulfilled, (state) => {
        state.list = [];
        state.current = null;
      })
      .addCase(modDeleteAllCourseCommunities.fulfilled, (state) => {
        state.list = state.list.filter((c) => c.type !== 'course');
        if (state.current?.type === 'course') state.current = null;
      });
  },
});

export const { removeCommunity, clearCommunities, clearCurrentCommunity } = communitiesSlice.actions;
export default communitiesSlice.reducer;
