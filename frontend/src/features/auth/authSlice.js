import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setToken, clearToken, getToken } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';
import { fetchCommunities } from '../communities/communitiesSlice';

/**
 * AUTH SLICE
 * ----------------------------------------------------------------------------
 * Holds the logged-in user, the auth token, and the status/errors for the
 * various auth flows (signup, verify, login, password reset, profile load).
 */

// --- Thunks ---------------------------------------------------------------

// Step 1 of signup: send email/username/password -> backend emails an OTP.
export const signup = createAsyncThunk('auth/signup', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/signup', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Step 2 of signup: verify the OTP -> backend returns token + user.
export const verify = createAsyncThunk('auth/verify', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Login with email OR username + password.
export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Request a password-reset code.
export const forgotPassword = createAsyncThunk('auth/forgot', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Complete a password reset with the emailed code.
export const resetPassword = createAsyncThunk('auth/reset', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Load the current user from a stored token (on app boot / refresh).
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Upload the schedule file (multipart). Updates enrolledSections + user.
export const uploadSchedule = createAsyncThunk('auth/schedule', async (file, { rejectWithValue, dispatch }) => {
  try {
    const form = new FormData();
    form.append('schedule', file);
    const { data } = await api.post('/users/me/schedule', form);
    await dispatch(fetchCommunities());
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// Complete post-signup community onboarding.
export const completeCommunityOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/me/community-onboarding');
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Change the anonymous username (once a week).
export const changeUsername = createAsyncThunk('auth/username', async (username, { rejectWithValue }) => {
  try {
    const { data } = await api.patch('/users/me/username', { username });
    return data.user;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// --- Slice ----------------------------------------------------------------

const initialState = {
  user: null,
  token: getToken() || null,
  // Boot state so we can show a splash while we resolve the stored token.
  booting: Boolean(getToken()),
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  notice: null, // transient success message for the UI
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      clearToken();
      disconnectSocket();
    },
    clearAuthMessages(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generic pending/rejected handling for all auth thunks.
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.booting = false;
          state.error = action.payload || 'Request failed.';
        }
      )
      // Token-issuing flows (verify + login) store the token + user.
      .addMatcher(
        (action) => ['auth/verify/fulfilled', 'auth/login/fulfilled'].includes(action.type),
        (state, action) => {
          state.status = 'succeeded';
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.notice = action.payload.message || null;
          setToken(action.payload.token);
        }
      )
      // Profile/user-updating flows just refresh the user object.
      .addMatcher(
        (action) =>
          ['auth/me/fulfilled', 'auth/schedule/fulfilled', 'auth/username/fulfilled', 'auth/completeOnboarding/fulfilled'].includes(
            action.type
          ),
        (state, action) => {
          state.status = 'succeeded';
          state.booting = false;
          state.user = action.payload?.user ?? action.payload;
        }
      )
      // Signup/forgot/reset just surface a success notice (no token yet).
      .addMatcher(
        (action) => action.type === 'communities/join/pending',
        (state, action) => {
          const arg = action.meta.arg;
          const id = typeof arg === 'string' ? arg : arg?._id;
          if (!id || !state.user) return;
          const joined = state.user.joinedCommunities || [];
          if (!joined.includes(id)) {
            state.user = { ...state.user, joinedCommunities: [...joined, id] };
          }
        }
      )
      .addMatcher(
        (action) =>
          ['communities/join/fulfilled', 'communities/leave/fulfilled'].includes(action.type),
        (state, action) => {
          if (action.payload?.user) state.user = action.payload.user;
        }
      )
      .addMatcher(
        (action) => action.type === 'communities/join/rejected',
        (state, action) => {
          const id = action.payload?.communityId;
          if (!id || !state.user) return;
          state.user = {
            ...state.user,
            joinedCommunities: (state.user.joinedCommunities || []).filter((x) => x !== id),
          };
        }
      )
      .addMatcher(
        (action) =>
          ['auth/signup/fulfilled', 'auth/forgot/fulfilled', 'auth/reset/fulfilled'].includes(
            action.type
          ),
        (state, action) => {
          state.status = 'succeeded';
          state.notice = action.payload.message || 'Success.';
        }
      );
  },
});

export const { logout, clearAuthMessages } = authSlice.actions;
export default authSlice.reducer;
