import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const normalizeItem = (raw) => ({
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
  likeCount: Array.isArray(raw.likes) ? raw.likes.length : raw.likes ?? 0,
  dislikeCount: Array.isArray(raw.dislikes) ? raw.dislikes.length : raw.dislikes ?? 0,
  reactions: raw.reactions || [],
});

export const fetchTimeline = createAsyncThunk(
  'chat/fetchTimeline',
  async (communityId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        `/communities/${encodeURIComponent(communityId)}/timeline`
      );
      return { communityId, items: (data.items || []).map(normalizeItem) };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const findInTimeline = (state, id) => {
  for (const bucket of Object.values(state.byCommunity)) {
    const item = bucket.timeline?.find((t) => t._id === id);
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
    messageReceived(state, action) {
      const item = normalizeItem({ ...action.payload, itemType: 'message' });
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => t._id === item._id)) {
        bucket.timeline.push(item);
      }
    },
    replyReceived(state, action) {
      const item = normalizeItem({ ...action.payload, itemType: 'reply' });
      const bucket = state.byCommunity[item.communityId];
      if (bucket && !bucket.timeline.some((t) => t._id === item._id)) {
        bucket.timeline.push(item);
      }
    },
    reactionReceived(state, action) {
      const { targetId, likes, dislikes, reactions } = action.payload;
      const item = findInTimeline(state, targetId);
      if (!item) return;
      if (typeof likes === 'number') item.likeCount = likes;
      if (typeof dislikes === 'number') item.dislikeCount = dislikes;
      if (reactions) item.reactions = reactions;
    },
    setMyReaction(state, action) {
      state.myReactions[action.payload.id] = action.payload.value;
    },
    messagesDeleted(state, action) {
      const { communityId, removedIds } = action.payload;
      const bucket = state.byCommunity[communityId];
      if (!bucket?.timeline) return;
      const gone = new Set(removedIds.map(String));
      bucket.timeline = bucket.timeline.filter((t) => !gone.has(String(t._id)));
      removedIds.forEach((id) => delete state.myReactions[id]);
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
      })
      .addCase(fetchTimeline.rejected, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = { timeline: [], status: 'failed', error: action.payload };
      });
  },
});

export const { messageReceived, replyReceived, reactionReceived, setMyReaction, messagesDeleted } =
  chatSlice.actions;
export default chatSlice.reducer;
