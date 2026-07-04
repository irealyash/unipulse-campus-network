/**
 * MOD MESSAGES SLICE
 * ----------------------------------------------------------------------------
 * Manages the moderator-to-user direct messaging system. Supports two views:
 *   - User side: a single conversation with the mod team (myConversation)
 *   - Moderator side: all conversations list + message thread for each
 *
 * Thunks cover fetching conversations, fetching/sending messages, starting
 * new conversations, and looking up users to message.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/** Extract a user-friendly error message from any error shape. */
const errMsg = (err) => err?.message || String(err) || 'Something went wrong.';

// --- Thunks ---------------------------------------------------------------

/**
 * Fetch the current user's conversation with moderators: GET /mod-messages/my-conversation
 * Used on the user-facing messages page.
 * @returns {Object|null} The conversation object, or null if none exists.
 */
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

/**
 * Fetch all mod message conversations (moderator view): GET /mod-messages/conversations
 * @returns {Array<Object>} Array of conversation objects sorted by lastMessageAt.
 */
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

/**
 * Fetch messages in a specific conversation: GET /mod-messages/conversations/:id/messages
 * @param {string} conversationId
 * @returns {{ conversation: Object, messages: Array }}
 */
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

/**
 * Send a message in an existing conversation: POST /mod-messages/conversations/:id/messages
 * @param {{ conversationId: string, content: string, media?: Object }} params
 * @returns {{ message: Object, conversation: Object }}
 */
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

/**
 * Start a new conversation with a user: POST /mod-messages/start
 * Only moderators can initiate conversations.
 * @param {{ identifier: string, content: string, media?: Object }} params
 * @returns {{ conversation: Object, message: Object }}
 */
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

/**
 * Look up a user for starting a new mod conversation: GET /mod-messages/lookup-user
 * @param {string} q - Search query (email or username).
 * @returns {Object|null} Matching user object, or null.
 */
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

// --- Slice ----------------------------------------------------------------

const modMessagesSlice = createSlice({
  name: 'modMessages',
  initialState: {
    /** The current user's single conversation with mods (user-side view). */
    myConversation: null,
    /** All conversations (moderator-side view), sorted by lastMessageAt. */
    conversations: [],
    /** ID of the conversation whose messages are currently displayed. */
    activeConversationId: null,
    /** Messages for the active conversation thread. */
    messages: [],
    /** User object found via the lookup-user search. */
    lookupUser: null,
    /** Async status for conversation-level operations. */
    status: 'idle',
    /** Async status specifically for message-level fetches. */
    messagesStatus: 'idle',
    /** Most recent error message. */
    error: null,
    /** Transient success notice. */
    notice: null,
  },
  reducers: {
    /** Set which conversation is currently active/displayed. */
    setActiveModConversation(state, action) {
      state.activeConversationId = action.payload;
    },
    /** Dismiss the success notice toast. */
    clearModMessageNotice(state) {
      state.notice = null;
    },
    /** Clear messages and active conversation (e.g. when navigating away). */
    clearModMessages(state) {
      state.messages = [];
      state.activeConversationId = null;
    },
    /** Clear the error message. */
    clearModMessageError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchMyModConversation (user side) ---
      .addCase(fetchMyModConversation.fulfilled, (state, action) => {
        state.myConversation = action.payload;
        state.status = 'succeeded';
      })

      // --- fetchModConversations (moderator side) ---
      .addCase(fetchModConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.status = 'succeeded';
      })

      // --- fetchModMessages (message thread) ---
      .addCase(fetchModMessages.pending, (state) => {
        state.messagesStatus = 'loading';
      })
      // Replace messages if same thread or larger payload; update the conversation object.
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

      // --- sendModMessage ---
      // Append the new message, update conversation metadata, re-sort by recency.
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

      // --- startModConversation ---
      // Create or replace conversation, set it active, show the first message.
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

      // --- lookupModMessageUser ---
      .addCase(lookupModMessageUser.fulfilled, (state, action) => {
        state.lookupUser = action.payload;
      })

      // --- Error handlers ---
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
