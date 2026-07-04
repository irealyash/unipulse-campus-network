import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import communitiesReducer from '../features/communities/communitiesSlice';
import chatReducer from '../features/chat/chatSlice';
import postsReducer from '../features/posts/postsSlice';
import eventsReducer from '../features/events/eventsSlice';
import moderatorReducer from '../features/moderator/moderatorSlice';
import modMessagesReducer from '../features/modMessages/modMessagesSlice';

/**
 * The single Redux store. Each feature owns its own slice of state.
 */
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
