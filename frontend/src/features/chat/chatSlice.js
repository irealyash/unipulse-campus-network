import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/**
 * CHAT SLICE
 * ----------------------------------------------------------------------------
 * Holds group-chat state per community: the message list, lazily-loaded reply
 * threads, and reaction counts. Sending happens over Socket.io; this slice
 * stores both the REST history and the live socket updates.
 *
 * Messages/replies are normalized to a common shape:
 *   { _id, anonymousUsername, content, createdAt, likeCount, dislikeCount, reactions[] }
 * `myReactions[id]` separately tracks THIS user's like/dislike so we can
 * highlight it (the server broadcasts only aggregate counts).
 */

// REST sends likes/dislikes as arrays; sockets send counts. Normalize both.
const normalize = (raw) => ({
  _id: raw._id || raw.id,
  communityId: raw.communityId,
  anonymousUsername: raw.anonymousUsername,
  content: raw.content,
  createdAt: raw.createdAt,
  parentMessageId: raw.parentMessageId || null,
  likeCount: Array.isArray(raw.likes) ? raw.likes.length : raw.likes || 0,
  dislikeCount: Array.isArray(raw.dislikes) ? raw.dislikes.length : raw.dislikes || 0,
  reactions: raw.reactions || [],
});

// --- Thunks ---------------------------------------------------------------

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (communityId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/communities/${encodeURIComponent(communityId)}/messages`);
      return { communityId, messages: data.messages.map(normalize) };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchReplies = createAsyncThunk(
  'chat/fetchReplies',
  async (messageId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/messages/${messageId}/replies`);
      // Flatten the (possibly nested) thread into a simple ordered list.
      const flat = [];
      const walk = (nodes) => {
        nodes.forEach((n) => {
          flat.push(normalize(n));
          if (n.replies?.length) walk(n.replies);
        });
      };
      walk(data.replies || []);
      return { messageId, replies: flat };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const reportContent = createAsyncThunk(
  'chat/report',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/reports', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- Helpers to locate a message/reply anywhere in state ------------------

const findAndUpdate = (state, id, updater) => {
  for (const cid of Object.keys(state.byCommunity)) {
    const msg = state.byCommunity[cid].messages.find((m) => m._id === id);
    if (msg) return updater(msg);
  }
  for (const mid of Object.keys(state.repliesByMessage)) {
    const reply = state.repliesByMessage[mid].find((r) => r._id === id);
    if (reply) return updater(reply);
  }
};

// --- Slice ----------------------------------------------------------------

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    byCommunity: {}, // { [communityId]: { messages, status, error } }
    repliesByMessage: {}, // { [messageId]: [reply,...] }
    myReactions: {}, // { [contentId]: 'like' | 'dislike' | null }
  },
  reducers: {
    // A new live message arrived over the socket.
    messageReceived(state, action) {
      const msg = normalize(action.payload);
      const bucket = state.byCommunity[msg.communityId];
      if (bucket) {
        if (!bucket.messages.some((m) => m._id === msg._id)) {
          bucket.messages.push(msg);
        }
      }
    },
    // A new live reply arrived over the socket.
    replyReceived(state, action) {
      const reply = normalize(action.payload);
      const parent = reply.parentMessageId;
      if (!state.repliesByMessage[parent]) state.repliesByMessage[parent] = [];
      if (!state.repliesByMessage[parent].some((r) => r._id === reply._id)) {
        state.repliesByMessage[parent].push(reply);
      }
    },
    // A reaction update (like/dislike counts + emoji array) arrived.
    reactionReceived(state, action) {
      const { targetId, likes, dislikes, reactions } = action.payload;
      findAndUpdate(state, targetId, (item) => {
        if (typeof likes === 'number') item.likeCount = likes;
        if (typeof dislikes === 'number') item.dislikeCount = dislikes;
        if (reactions) item.reactions = reactions;
      });
    },
    // Track this user's own like/dislike choice for highlighting.
    setMyReaction(state, action) {
      const { id, value } = action.payload;
      state.myReactions[id] = value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = state.byCommunity[cid] || { messages: [] };
        state.byCommunity[cid].status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { communityId, messages } = action.payload;
        state.byCommunity[communityId] = { messages, status: 'succeeded' };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const cid = action.meta.arg;
        state.byCommunity[cid] = { messages: [], status: 'failed', error: action.payload };
      })
      .addCase(fetchReplies.fulfilled, (state, action) => {
        state.repliesByMessage[action.payload.messageId] = action.payload.replies;
      });
  },
});

export const { messageReceived, replyReceived, reactionReceived, setMyReaction } =
  chatSlice.actions;
export default chatSlice.reducer;
