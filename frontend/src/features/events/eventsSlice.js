import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const ALL_PUBLIC_EVENTS_KEY = '__all_public__';

const eventIdStr = (id) => String(id);

const normalizeEvent = (raw) => {
  if (!raw) return raw;
  const comingCount =
    raw.comingCount ?? (Array.isArray(raw.coming) ? raw.coming.length : 0);
  const busyCount = raw.busyCount ?? (Array.isArray(raw.busy) ? raw.busy.length : 0);
  const { coming, busy, ...rest } = raw;
  return {
    ...rest,
    comingCount,
    busyCount,
    myRsvp: raw.myRsvp ?? null,
  };
};

const applyOptimisticRsvp = (event, status) => {
  const prev = event.myRsvp;
  let comingCount =
    event.comingCount ?? (Array.isArray(event.coming) ? event.coming.length : 0);
  let busyCount = event.busyCount ?? (Array.isArray(event.busy) ? event.busy.length : 0);

  if (prev === 'coming') comingCount = Math.max(0, comingCount - 1);
  if (prev === 'busy') busyCount = Math.max(0, busyCount - 1);

  if (status === 'coming') comingCount += 1;
  if (status === 'busy') busyCount += 1;

  return {
    ...event,
    myRsvp: status === 'none' ? null : status,
    comingCount,
    busyCount,
    rsvpPending: true,
  };
};

const preservePendingRsvp = (incoming, prev) => {
  if (!prev?.rsvpPending) return incoming;
  return {
    ...incoming,
    comingCount: prev.comingCount,
    busyCount: prev.busyCount,
    myRsvp: prev.myRsvp,
    rsvpPending: true,
  };
};

const patchEventInState = (state, eventId, patch) => {
  const id = eventIdStr(eventId);
  if (state.currentEvent && eventIdStr(state.currentEvent._id) === id) {
    state.currentEvent = patch(state.currentEvent);
  }
  Object.values(state.byCommunity).forEach((b) => {
    const i = b.events?.findIndex((e) => eventIdStr(e._id) === id);
    if (i >= 0) b.events[i] = patch(b.events[i]);
  });
};

export const fetchAllPublicEvents = createAsyncThunk(
  'events/fetchAllPublic',
  async ({ sort = 'date' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/events/public', { params: { sort } });
      return { events: data.events, sort };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

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
    rsvpInFlight: null,
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
        const prev = state.byCommunity[cid];
        state.byCommunity[cid] = { events: prev?.events ?? [], status: 'loading' };
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        const { communityId, events } = action.payload;
        const prevEvents = state.byCommunity[communityId]?.events ?? [];
        const merged = events.map(normalizeEvent).map((ev) => {
          const prev = prevEvents.find((p) => eventIdStr(p._id) === eventIdStr(ev._id));
          return preservePendingRsvp(ev, prev);
        });
        state.byCommunity[communityId] = { events: merged, status: 'succeeded' };
      })
      .addCase(fetchAllPublicEvents.pending, (state) => {
        const prev = state.byCommunity[ALL_PUBLIC_EVENTS_KEY];
        state.byCommunity[ALL_PUBLIC_EVENTS_KEY] = {
          events: prev?.events ?? [],
          status: 'loading',
        };
      })
      .addCase(fetchAllPublicEvents.fulfilled, (state, action) => {
        const prevEvents = state.byCommunity[ALL_PUBLIC_EVENTS_KEY]?.events ?? [];
        const merged = action.payload.events.map(normalizeEvent).map((ev) => {
          const prev = prevEvents.find((p) => eventIdStr(p._id) === eventIdStr(ev._id));
          return preservePendingRsvp(ev, prev);
        });
        state.byCommunity[ALL_PUBLIC_EVENTS_KEY] = {
          events: merged,
          status: 'succeeded',
        };
      })
      .addCase(fetchEvent.fulfilled, (state, action) => {
        const incoming = normalizeEvent(action.payload);
        const id = eventIdStr(incoming._id);
        if (state.rsvpInFlight && eventIdStr(state.rsvpInFlight) === id) return;
        if (state.currentEvent?.rsvpPending && eventIdStr(state.currentEvent._id) === id) {
          state.currentEvent = preservePendingRsvp(incoming, state.currentEvent);
          return;
        }
        state.currentEvent = incoming;
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
        state.rsvpInFlight = eventId;
        patchEventInState(state, eventId, (ev) => applyOptimisticRsvp(ev, status));
      })
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        state.rsvpInFlight = null;
        const updated = { ...normalizeEvent(action.payload), rsvpPending: false };
        patchEventInState(state, updated._id, () => updated);
      })
      .addCase(rsvpEvent.rejected, (state, action) => {
        state.rsvpInFlight = null;
        const { eventId, status, previousRsvp } = action.meta.arg;
        patchEventInState(state, eventId, (ev) => {
          if (!ev.rsvpPending) return { ...ev, rsvpPending: false };
          let comingCount = ev.comingCount ?? 0;
          let busyCount = ev.busyCount ?? 0;
          if (status === 'coming') comingCount = Math.max(0, comingCount - 1);
          if (status === 'busy') busyCount = Math.max(0, busyCount - 1);
          if (previousRsvp === 'coming') comingCount += 1;
          if (previousRsvp === 'busy') busyCount += 1;
          return {
            ...ev,
            comingCount,
            busyCount,
            myRsvp: previousRsvp ?? null,
            rsvpPending: false,
          };
        });
      });
  },
});

export const { clearEventNotice, clearCurrentEvent, showEventNotice } = eventsSlice.actions;
export default eventsSlice.reducer;
