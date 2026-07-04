/**
 * REDUX STORE
 * ----------------------------------------------------------------------------
 * Configures and exports the single Redux store for the entire UniPulse app.
 * Uses Redux Toolkit's configureStore which automatically sets up:
 *   - Redux DevTools integration
 *   - redux-thunk middleware (for async thunks)
 *   - Immutability and serializability checks in development
 *
 * Each feature slice owns its own top-level key in the state tree:
 *   - auth:         User session, JWT, login/signup status
 *   - communities:  Community list, catalog, single-community detail
 *   - chat:         Real-time chat timelines per community
 *   - posts:        Forum posts, comments, and votes per community
 *   - events:       Community and public events, RSVPs
 *   - moderator:    Moderator dashboard data (reports, requests, pending content)
 *   - modMessages:  Moderator-to-user direct messaging system
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import communitiesReducer from '../features/communities/communitiesSlice';
import chatReducer from '../features/chat/chatSlice';
import postsReducer from '../features/posts/postsSlice';
import eventsReducer from '../features/events/eventsSlice';
import moderatorReducer from '../features/moderator/moderatorSlice';
import modMessagesReducer from '../features/modMessages/modMessagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    communities: communitiesReducer,
    chat: chatReducer,
    posts: postsReducer,
    events: eventsReducer,
    moderator: moderatorReducer,
    modMessages: modMessagesReducer,
  },
});
