import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const applyOptimisticRsvp = (event, status) => {
  const prev = event.myRsvp;
  let comingCount = event.comingCount ?? 0;
  let busyCount = event.busyCount ?? 0;

  if (prev === 'coming') comingCount = Math.max(0, comingCount - 1);
  if (prev === 'busy') busyCount = Math.max(0, busyCount - 1);

  if (status === 'coming') comingCount += 1;
  if (status === 'busy') busyCount += 1;

  return {
    ...event,
    myRsvp: status === 'none' ? null : status,
    comingCount,
    busyCount,
  };
};

const patchEventInState = (state, eventId, patch) => {
  if (state.currentEvent?._id === eventId) {
    state.currentEvent = patch(state.currentEvent);
  }
  Object.values(state.byCommunity).forEach((b) => {
    const i = b.events?.findIndex((e) => e._id === eventId);
    if (i >= 0) b.events[i] = patch(b.events[i]);
  });
};

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
    showEventNotice(state, action) {
      state.notice = action.payload;
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
      .addCase(rsvpEvent.pending, (state, action) => {
        const { eventId, status } = action.meta.arg;
        patchEventInState(state, eventId, (ev) => applyOptimisticRsvp(ev, status));
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

export const { clearEventNotice, clearCurrentEvent, showEventNotice } = eventsSlice.actions;
export default eventsSlice.reducer;
