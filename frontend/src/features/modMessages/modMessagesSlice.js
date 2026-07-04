import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const errMsg = (err) => err?.message || String(err) || 'Something went wrong.';

export const fetchMyModConversation = createAsyncThunk(
  'modMessages/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mod-messages/my-conversation');
      return data.conversation;
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const fetchModConversations = createAsyncThunk(
  'modMessages/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mod-messages/conversations');
      return data.conversations;
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const fetchModMessages = createAsyncThunk(
  'modMessages/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        `/mod-messages/conversations/${encodeURIComponent(conversationId)}/messages`
      );
      return { conversation: data.conversation, messages: data.messages };
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const sendModMessage = createAsyncThunk(
  'modMessages/send',
  async ({ conversationId, content, media }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        `/mod-messages/conversations/${encodeURIComponent(conversationId)}/messages`,
        { content: content || '', media: media || undefined }
      );
      return data;
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const startModConversation = createAsyncThunk(
  'modMessages/start',
  async ({ identifier, content, media }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/mod-messages/start', {
        identifier,
        content: content || '',
        media: media || undefined,
      });
      return data;
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

export const lookupModMessageUser = createAsyncThunk(
  'modMessages/lookupUser',
  async (q, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/mod-messages/lookup-user', { params: { q } });
      return data.user;
    } catch (err) {
      return rejectWithValue(errMsg(err));
    }
  }
);

const modMessagesSlice = createSlice({
  name: 'modMessages',
  initialState: {
    myConversation: null,
    conversations: [],
    activeConversationId: null,
    messages: [],
    lookupUser: null,
    status: 'idle',
    messagesStatus: 'idle',
    error: null,
    notice: null,
  },
  reducers: {
    setActiveModConversation(state, action) {
      state.activeConversationId = action.payload;
    },
    clearModMessageNotice(state) {
      state.notice = null;
    },
    clearModMessages(state) {
      state.messages = [];
      state.activeConversationId = null;
    },
    clearModMessageError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyModConversation.fulfilled, (state, action) => {
        state.myConversation = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchModConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchModMessages.pending, (state) => {
        state.messagesStatus = 'loading';
      })
      .addCase(fetchModMessages.fulfilled, (state, action) => {
        state.messagesStatus = 'succeeded';
        const incoming = action.payload.messages;
        const sameThread =
          !state.messages.length ||
          state.messages[0]?.conversationId === incoming[0]?.conversationId ||
          state.activeConversationId === action.payload.conversation._id;
        if (sameThread || incoming.length >= state.messages.length) {
          state.messages = incoming;
        }
        state.activeConversationId = action.payload.conversation._id;
        const idx = state.conversations.findIndex(
          (c) => c._id === action.payload.conversation._id
        );
        if (idx >= 0) state.conversations[idx] = action.payload.conversation;
      })
      .addCase(sendModMessage.fulfilled, (state, action) => {
        state.error = null;
        const incoming = action.payload.message;
        if (!state.messages.some((m) => m._id === incoming._id)) {
          state.messages.push(incoming);
        }
        const conv = action.payload.conversation;
        state.myConversation =
          state.myConversation?._id === conv._id ? conv : state.myConversation;
        const i = state.conversations.findIndex((c) => c._id === conv._id);
        if (i >= 0) {
          state.conversations[i] = conv;
        } else {
          state.conversations.unshift(conv);
        }
        state.conversations.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      })
      .addCase(startModConversation.fulfilled, (state, action) => {
        state.error = null;
        state.notice = 'Message sent.';
        const conv = action.payload.conversation;
        const i = state.conversations.findIndex((c) => c._id === conv._id);
        if (i >= 0) state.conversations[i] = conv;
        else state.conversations.unshift(conv);
        state.activeConversationId = conv._id;
        state.messages = [action.payload.message];
        state.lookupUser = null;
      })
      .addCase(lookupModMessageUser.fulfilled, (state, action) => {
        state.lookupUser = action.payload;
      })
      .addCase(sendModMessage.rejected, (state, action) => {
        state.error = action.payload || 'Could not send message.';
      })
      .addCase(startModConversation.rejected, (state, action) => {
        state.error = action.payload || 'Could not start conversation.';
      });
  },
});

export const { setActiveModConversation, clearModMessageNotice, clearModMessages, clearModMessageError } =
  modMessagesSlice.actions;
export default modMessagesSlice.reducer;
