import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

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
  reducers: {},
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
      });
  },
});

export default communitiesSlice.reducer;
