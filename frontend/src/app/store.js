import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import communitiesReducer from '../features/communities/communitiesSlice';
import chatReducer from '../features/chat/chatSlice';
import moderatorReducer from '../features/moderator/moderatorSlice';

/**
 * The single Redux store. Each feature owns its own slice of state.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    communities: communitiesReducer,
    chat: chatReducer,
    moderator: moderatorReducer,
  },
});
