import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';
import { applyOptimisticEmoji, applyOptimisticVote, voteFromArrays } from '../../lib/votes';

const normalizeItem = (raw, userId) => {
  const likes = raw.likes || [];
  const dislikes = raw.dislikes || [];
  const likeCount = Array.isArray(likes) ? likes.length : raw.likeCount ?? raw.likes ?? 0;
  const dislikeCount = Array.isArray(dislikes) ? dislikes.length : raw.dislikeCount ?? raw.dislikes ?? 0;

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
    reactions: raw.reactions || [],
    pending: Boolean(raw.pending),
    clientKey: raw.clientKey || null,
  };
};

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

const findInTimeline = (state, id) => {
  const key = String(id);
  for (const bucket of Object.values(state.byCommunity)) {
    const item = bucket.timeline?.find((t) => String(t._id) === key);
    if (item) return item;
  }
  return null;
};

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    byCommunity: {},
    myReactions: {},
  },
  reducers: {
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
        null
      );
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }
    },
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
        null
      );
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => String(t._id) === String(item._id))) {
        bucket.timeline.push(item);
      }
    },
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
    reactionReceived(state, action) {
      const { targetId, likes, dislikes, reactions } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item) return;
      if (typeof likes === 'number') item.likeCount = likes;
      if (typeof dislikes === 'number') item.dislikeCount = dislikes;
      if (reactions) item.reactions = reactions;
      if (item.myVote) state.myReactions[String(targetId)] = item.myVote;
    },
    setMyReaction(state, action) {
      const id = String(action.payload.id);
      const value = action.payload.value;
      state.myReactions[id] = value;
      const item = findInTimeline(state, id);
      if (item) item.myVote = value;
    },
    optimisticChatReaction(state, action) {
      const { targetId, action: voteAction, userId } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item || !userId) return;
      const updated = applyOptimisticVote(item, voteAction, userId);
      Object.assign(item, updated);
      state.myReactions[String(targetId)] = updated.myVote;
    },
    optimisticChatEmoji(state, action) {
      const { targetId, emoji, userId } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item || !userId) return;
      Object.assign(item, applyOptimisticEmoji(item, emoji, userId));
    },
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
      .addCase(fetchTimeline.pending, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = state.byCommunity[cid] || { timeline: [] };
        state.byCommunity[cid].status = 'loading';
      })
      .addCase(fetchTimeline.fulfilled, (state, action) => {
        const { communityId, items } = action.payload;
        state.byCommunity[communityId] = { timeline: items, status: 'succeeded' };
        items.forEach((item) => {
          if (item.myVote) state.myReactions[String(item._id)] = item.myVote;
        });
      })
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
