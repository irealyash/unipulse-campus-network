import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async ({ communityId, past = false }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(communityId)}/events`, {
        params: { past: past ? 'true' : 'false' },
      });
      return { communityId, events: data.events };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async ({ communityId, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/communities/${encodeURIComponent(communityId)}/events`, payload);
      return { communityId, event: data.event };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rsvpEvent = createAsyncThunk(
  'events/rsvp',
  async ({ eventId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/events/${eventId}/rsvp`, { status });
      return data.event;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    byCommunity: {},
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        const cid = action.meta.arg.communityId;
        state.byCommunity[cid] = { events: [], status: 'loading' };
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.byCommunity[action.payload.communityId] = {
          events: action.payload.events,
          status: 'succeeded',
        };
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        const { communityId, event } = action.payload;
        const bucket = state.byCommunity[communityId];
        if (bucket) bucket.events = [event, ...bucket.events];
      })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        const updated = action.payload;
        Object.values(state.byCommunity).forEach((b) => {
          const i = b.events?.findIndex((e) => e._id === updated._id);
          if (i >= 0) b.events[i] = updated;
        });
      });
  },
});

export default eventsSlice.reducer;
