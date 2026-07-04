/**
 * EVENTS SLICE
 * ----------------------------------------------------------------------------
 * Manages community events and the global public events feed. Supports:
 *   - Fetching events per community (upcoming or past)
 *   - Fetching the cross-community public events feed
 *   - Fetching a single event detail
 *   - Creating events (may require moderator approval)
 *   - RSVP with optimistic updates (coming / busy / none)
 *
 * Events are bucketed by community ID (or the special ALL_PUBLIC_EVENTS_KEY
 * for the global feed). RSVP uses optimistic count adjustments so the UI
 * updates instantly, with rollback on failure.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/** Sentinel key used as a community bucket ID for the global public events feed. */
export const ALL_PUBLIC_EVENTS_KEY = '__all_public__';

/** Coerce an event ID to string for safe comparison. */
const eventIdStr = (id) => String(id);

/**
 * Normalize a raw event from the API into a consistent shape.
 * Converts coming/busy arrays into counts and strips the arrays.
 * @param {Object} raw - Raw event object from server.
 * @returns {Object} Normalized event with comingCount, busyCount, myRsvp.
 */
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

/**
 * Apply an optimistic RSVP status change to an event.
 * Adjusts comingCount/busyCount based on previous and new status.
 * @param {Object} event  - Current event state.
 * @param {string} status - New RSVP status: 'coming' | 'busy' | 'none'.
 * @returns {Object} Updated event with adjusted counts and rsvpPending flag.
 */
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

/**
 * If an event has a pending optimistic RSVP, preserve those counts
 * instead of overwriting with (possibly stale) server data.
 * @param {Object} incoming - Freshly fetched event.
 * @param {Object} prev     - Previous state of the same event.
 * @returns {Object} Merged event.
 */
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

/**
 * Patch an event everywhere it appears in state (currentEvent + all buckets).
 * @param {Object}   state   - The events slice state.
 * @param {string}   eventId - ID of the event to patch.
 * @param {Function} patch   - Transformer fn: (event) => updatedEvent.
 */
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

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch cross-community public events: GET /events/public
 * @param {{ sort?: string, tag?: string }} params
 * @returns {{ events: Array, sort: string }}
 */
export const fetchAllPublicEvents = createAsyncThunk(
  'events/fetchAllPublic',
  async ({ sort = 'date', tag = 'all' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/events/public', {
        params: { sort, ...(tag && tag !== 'all' ? { tag } : {}) },
      });
      return { events: data.events, sort };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch events for a specific community: GET /communities/:id/events
 * @param {{ communityId: string, past?: boolean, sort?: string, tag?: string }} params
 * @returns {{ communityId, events: Array }}
 */
export const fetchEvents = createAsyncThunk(
  'events/fetch',
  async ({ communityId, past = false, sort = 'date', tag = 'all' }, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(communityId)}/events`, {
        params: {
          past: past ? 'true' : 'false',
          sort,
          ...(tag && tag !== 'all' ? { tag } : {}),
        },
      });
      return { communityId, events: data.events };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Fetch a single event: GET /events/:eventId
 * @param {string} eventId
 * @returns {Object} The full event object.
 */
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

/**
 * Create an event in a community: POST /communities/:id/events
 * Events may require moderator approval before becoming visible.
 * @param {{ communityId: string, payload: Object }} params
 * @returns {{ communityId, event, message }}
 */
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

/**
 * RSVP to an event: POST /events/:eventId/rsvp
 * @param {{ eventId: string, status: 'coming'|'busy'|'none' }} params
 * @returns {Object} Updated event from server.
 */
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

// --- Slice ----------------------------------------------------------------

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    /** Events bucketed by community ID (or ALL_PUBLIC_EVENTS_KEY) → { events, status }. */
    byCommunity: {},
    /** The single event being viewed on the detail page. */
    currentEvent: null,
    /** Event ID currently mid-RSVP, used to guard against stale fetchEvent overwrites. */
    rsvpInFlight: null,
    /** General async status. */
    status: 'idle',
    /** Most recent error message. */
    error: null,
    /** Transient success notice (e.g. "Event submitted for approval"). */
    notice: null,
  },
  reducers: {
    /** Dismiss the event notice toast. */
    clearEventNotice(state) {
      state.notice = null;
    },
    /** Manually set a notice message. */
    showEventNotice(state, action) {
      state.notice = action.payload;
    },
    /** Clear the detail-view event when navigating away. */
    clearCurrentEvent(state) {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchEvents (per community) ---
      .addCase(fetchEvents.pending, (state, action) => {
        const cid = action.meta.arg.communityId;
        const prev = state.byCommunity[cid];
        state.byCommunity[cid] = { events: prev?.events ?? [], status: 'loading' };
      })
      // Fulfilled: normalize events and preserve any in-flight RSVP counts.
      .addCase(fetchEvents.fulfilled, (state, action) => {
        const { communityId, events } = action.payload;
        const prevEvents = state.byCommunity[communityId]?.events ?? [];
        const merged = events.map(normalizeEvent).map((ev) => {
          const prev = prevEvents.find((p) => eventIdStr(p._id) === eventIdStr(ev._id));
          return preservePendingRsvp(ev, prev);
        });
        state.byCommunity[communityId] = { events: merged, status: 'succeeded' };
      })

      // --- fetchAllPublicEvents (global feed) ---
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

      // --- fetchEvent (single detail) ---
      // Skip overwrite if an RSVP is in flight for this event to prevent stale data.
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

      // --- createEvent ---
      // Only auto-approved events are added to the bucket immediately.
      .addCase(createEvent.fulfilled, (state, action) => {
        const { communityId, event, message } = action.payload;
        state.notice = message || 'Event submitted for moderator approval.';
        if (event?.status === 'approved') {
          const bucket = state.byCommunity[communityId];
          if (bucket) bucket.events = [event, ...bucket.events];
        }
      })

      // --- rsvpEvent ---
      // Pending: optimistically adjust counts and set rsvpInFlight guard.
      .addCase(rsvpEvent.pending, (state, action) => {
        const { eventId, status } = action.meta.arg;
        state.rsvpInFlight = eventId;
        patchEventInState(state, eventId, (ev) => applyOptimisticRsvp(ev, status));
      })
      // Fulfilled: replace with server-confirmed data; clear rsvpPending flag.
      .addCase(rsvpEvent.fulfilled, (state, action) => {
        state.rsvpInFlight = null;
        const updated = { ...normalizeEvent(action.payload), rsvpPending: false };
        patchEventInState(state, updated._id, () => updated);
      })
      // Rejected: roll back optimistic RSVP to the previous state.
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
