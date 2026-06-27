import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { modDeleteCommunity, modDeleteAllCommunities } from '../moderator/moderatorSlice';

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

const communitiesSlice = createSlice({
  name: 'communities',
  initialState: {
    list: [],
    current: null,
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
        if (!state.list.some((c) => c._id === action.payload._id)) {
          state.list.push(action.payload);
        }
      })
      .addCase(fetchCommunity.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(modDeleteCommunity.fulfilled, (state, action) => {
        const id = action.payload.communityId;
        state.list = state.list.filter((c) => c._id !== id);
        if (state.current?._id === id) state.current = null;
      })
      .addCase(modDeleteAllCommunities.fulfilled, (state) => {
        state.list = [];
        state.current = null;
      });
  },
});

export const { removeCommunity, clearCommunities, clearCurrentCommunity } = communitiesSlice.actions;
export default communitiesSlice.reducer;
