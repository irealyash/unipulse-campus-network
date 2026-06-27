import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async ({ communityId, past = false, sort = 'date' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(communityId)}/events`, {
        params: { past: past ? 'true' : 'false', sort },
      });
      return { communityId, events: data.events };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEvent = createAsyncThunk(
  'events/fetchOne',
  async (eventId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/events/${eventId}`);
      return data.event;
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
      return { communityId, event: data.event, message: data.message };
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
    currentEvent: null,
    status: 'idle',
    error: null,
    notice: null,
  },
  reducers: {
    clearEventNotice(state) {
      state.notice = null;
    },
    clearCurrentEvent(state) {
      state.currentEvent = null;
    },
  },
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
      .addCase(fetchEvent.fulfilled, (state, action) => {
        state.currentEvent = action.payload;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        const { communityId, event, message } = action.payload;
        state.notice = message || 'Event submitted for moderator approval.';
        if (event?.status === 'approved') {
          const bucket = state.byCommunity[communityId];
          if (bucket) bucket.events = [event, ...bucket.events];
        }
      })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.currentEvent?._id === updated._id) {
          state.currentEvent = updated;
        }
        Object.values(state.byCommunity).forEach((b) => {
          const i = b.events?.findIndex((e) => e._id === updated._id);
          if (i >= 0) b.events[i] = updated;
        });
      });
  },
});

export const { clearEventNotice, clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
