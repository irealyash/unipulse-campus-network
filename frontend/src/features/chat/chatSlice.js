/**
 * CHAT SLICE
 * ----------------------------------------------------------------------------
 * Real-time chat state for community timelines. Each community has a flat
 * timeline array of messages and replies. The slice handles:
 *   - Fetching the initial timeline from the REST API
 *   - Optimistic inserts for outgoing messages/replies (before socket ack)
 *   - Socket-driven inbound messages, replies, reactions, and deletions
 *   - Optimistic like/dislike/emoji reactions on chat items
 *
 * All chat items are normalized through `normalizeItem` to guarantee a
 * consistent shape regardless of whether they came from the REST API or
 * a socket event.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { applyOptimisticEmoji, applyOptimisticVote, voteFromArrays } from '../../lib/votes';

/**
 * Normalize a raw chat item (from API or socket) into a consistent shape.
 * Computes derived fields like likeCount, dislikeCount, score, myVote, and isMine.
 * @param {Object} raw    - Raw message/reply object from server or socket.
 * @param {string} userId - The current user's ID, for computing myVote/isMine.
 * @returns {Object} Normalized chat item.
 */
const normalizeItem = (raw, userId) => {
  const likes = raw.likes || [];
  const dislikes = raw.dislikes || [];
  const likeCount = Array.isArray(likes) ? likes.length : raw.likeCount ?? raw.likes ?? 0;
  const dislikeCount = Array.isArray(dislikes) ? dislikes.length : raw.dislikeCount ?? raw.dislikes ?? 0;

  const senderId = raw.senderId ? String(raw.senderId) : null;
  const isMine = Boolean(
    raw.isMine || (userId && senderId && String(senderId) === String(userId))
  );

  return {
    _id: raw._id || raw.id,
    itemType: raw.itemType || (raw.parentMessageId ? 'reply' : 'message'),
    communityId: raw.communityId,
    anonymousUsername: raw.anonymousUsername,
    content: raw.content || '',
    media: raw.media?.url ? raw.media : null,
    parentMessageId: raw.parentMessageId || null,
    parentAuthor: raw.parentAuthor || null,
    parentPreview: raw.parentPreview || null,
    createdAt: raw.createdAt,
    likes: Array.isArray(likes) ? likes : [],
    dislikes: Array.isArray(dislikes) ? dislikes : [],
    likeCount,
    dislikeCount,
    score: raw.score ?? likeCount - dislikeCount,
    myVote: raw.myVote ?? voteFromArrays(likes, dislikes, userId),
    senderId,
    isMine,
    reactions: raw.reactions || [],
    pending: Boolean(raw.pending),
    clientKey: raw.clientKey || null,
  };
};

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch the chat timeline for a community: GET /communities/:id/timeline
 * Normalizes every item and seeds the myReactions map.
 * @param {string} communityId
 * @returns {{ communityId, items: Array }} Normalized timeline items.
 */
export const fetchTimeline = createAsyncThunk(
  'chat/fetchTimeline',
  async (communityId, { rejectWithValue, getState }) => {
    try {
      const userId = getState().auth.user?.id;
      const { data } = await api.get(
        `/communities/${encodeURIComponent(communityId)}/timeline`
      );
      return {
        communityId,
        items: (data.items || []).map((item) => normalizeItem(item, userId)),
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Search all community buckets for a timeline item by its ID.
 * @param {Object} state - The chat slice state.
 * @param {string} id    - The item ID to find.
 * @returns {Object|null} The matching timeline item, or null.
 */
const findInTimeline = (state, id) => {
  const key = String(id);
  for (const bucket of Object.values(state.byCommunity)) {
    const item = bucket.timeline?.find((t) => String(t._id) === key);
    if (item) return item;
  }
  return null;
};

// --- Slice ----------------------------------------------------------------

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    /** Chat timelines bucketed by community ID → { timeline: Array, status }. */
    byCommunity: {},
    /** Quick-lookup map of item ID → user's current vote, for UI highlight state. */
    myReactions: {},
  },
  reducers: {
    /** Add an optimistic outgoing message before the socket confirms it. */
    optimisticMessage(state, action) {
      const tempId = action.payload._id || `temp-${Date.now()}`;
      const item = normalizeItem(
        {
          ...action.payload,
          _id: tempId,
          clientKey: action.payload.clientKey || tempId,
          itemType: 'message',
          pending: true,
        },
        action.payload.senderId
      );
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }
    },

    /** Add an optimistic outgoing reply before the socket confirms it. */
    optimisticReply(state, action) {
      const tempId = action.payload._id || `temp-${Date.now()}`;
      const item = normalizeItem(
        {
          ...action.payload,
          _id: tempId,
          clientKey: action.payload.clientKey || tempId,
          itemType: 'reply',
          pending: true,
        },
        action.payload.senderId
      );
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }
    },

    /**
     * Handle an inbound message from the socket.
     * If it matches a pending optimistic message, reconcile in place;
     * otherwise append to the timeline.
     */
    messageReceived(state, action) {
      const userId = action.payload._userId;
      const item = normalizeItem({ ...action.payload, itemType: 'message' }, userId);
      const bucket = state.byCommunity[item.communityId];
      if (!bucket) return;

      const pendingIdx = bucket.timeline.findIndex(
        (t) =>
          t.pending &&
          t.itemType === 'message' &&
          t.anonymousUsername === item.anonymousUsername &&
          t.content === item.content &&
          String(t.media?.url || '') === String(item.media?.url || '')
      );

      if (pendingIdx !== -1) {
        const existing = bucket.timeline[pendingIdx];
        const clientKey = existing.clientKey || existing._id;
        Object.assign(existing, item, { pending: false, clientKey });
        if (item.myVote) state.myReactions[item._id] = item.myVote;
        return;
      }

      if (!bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }

      if (item.myVote) state.myReactions[item._id] = item.myVote;
    },

    /**
     * Handle an inbound reply from the socket.
     * Same reconciliation logic as messageReceived but for reply items.
     */
    replyReceived(state, action) {
      const userId = action.payload._userId;
      const item = normalizeItem({ ...action.payload, itemType: 'reply' }, userId);
      const bucket = state.byCommunity[item.communityId];
      if (!bucket) return;

      const pendingIdx = bucket.timeline.findIndex(
        (t) =>
          t.pending &&
          t.itemType === 'reply' &&
          t.parentMessageId === item.parentMessageId &&
          t.anonymousUsername === item.anonymousUsername &&
          t.content === item.content
      );

      if (pendingIdx !== -1) {
        const existing = bucket.timeline[pendingIdx];
        const clientKey = existing.clientKey || existing._id;
        Object.assign(existing, item, { pending: false, clientKey });
        if (item.myVote) state.myReactions[item._id] = item.myVote;
        return;
      }

      if (!bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }

      if (item.myVote) state.myReactions[item._id] = item.myVote;
    },

    /** Update vote counts and emoji reactions on a chat item from a socket event. */
    reactionReceived(state, action) {
      const { targetId, likes, dislikes, reactions } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item) return;
      if (typeof likes === 'number') item.likeCount = likes;
      if (typeof dislikes === 'number') item.dislikeCount = dislikes;
      if (reactions) item.reactions = reactions;
      if (item.myVote) state.myReactions[String(targetId)] = item.myVote;
    },

    /** Manually set the current user's reaction on an item (for UI sync). */
    setMyReaction(state, action) {
      const id = String(action.payload.id);
      const value = action.payload.value;
      state.myReactions[id] = value;
      const item = findInTimeline(state, id);
      if (item) item.myVote = value;
    },

    /** Optimistically apply a like/dislike vote on a chat item before the API responds. */
    optimisticChatReaction(state, action) {
      const { targetId, action: voteAction, userId } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item || !userId) return;
      const updated = applyOptimisticVote(item, voteAction, userId);
      Object.assign(item, updated);
      state.myReactions[String(targetId)] = updated.myVote;
    },

    /** Optimistically toggle an emoji reaction on a chat item. */
    optimisticChatEmoji(state, action) {
      const { targetId, emoji, userId } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item || !userId) return;
      Object.assign(item, applyOptimisticEmoji(item, emoji, userId));
    },

    /** Remove messages from the timeline when a moderator deletes them. */
    messagesDeleted(state, action) {
      const { communityId, removedIds } = action.payload;
      const bucket = state.byCommunity[communityId];
      if (!bucket?.timeline) return;
      const gone = new Set(removedIds.map(String));
      bucket.timeline = bucket.timeline.filter((t) => !gone.has(String(t._id)));
      removedIds.forEach((id) => delete state.myReactions[String(id)]);
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending: initialize the community bucket and mark as loading.
      .addCase(fetchTimeline.pending, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = state.byCommunity[cid] || { timeline: [] };
        state.byCommunity[cid].status = 'loading';
      })
      // Fulfilled: replace the timeline with fresh data and seed myReactions.
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        const { communityId, items } = action.payload;
        state.byCommunity[communityId] = { timeline: items, status: 'succeeded' };
        items.forEach((item) => {
          if (item.myVote) state.myReactions[String(item._id)] = item.myVote;
        });
      })
      // Rejected: store the error in the community bucket.
      .addCase(fetchTimeline.rejected, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = { timeline: [], status: 'failed', error: action.payload };
      });
  },
});

export const {
  messageReceived,
  replyReceived,
  reactionReceived,
  setMyReaction,
  optimisticMessage,
  optimisticReply,
  optimisticChatReaction,
  optimisticChatEmoji,
  messagesDeleted,
} = chatSlice.actions;
export default chatSlice.reducer;
