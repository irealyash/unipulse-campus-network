/**
 * AUTH SLICE
 * ----------------------------------------------------------------------------
 * Manages all authentication-related state for the UniPulse app.
 * Holds the logged-in user object, JWT token, and status/error flags for
 * signup, OTP verification, login, password reset, profile loading, schedule
 * upload, community onboarding, and username changes.
 *
 * Also reacts to community join/leave actions so the user's joinedCommunities
 * array stays in sync without a full profile refetch.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setToken, clearToken, getToken } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';
import { fetchCommunities } from '../communities/communitiesSlice';

// --- Thunks ---------------------------------------------------------------

/**
 * Step 1 of signup: POST /auth/signup
 * @param {Object} payload - { email, username, password }
 * @returns {{ message: string }} Success notice; backend emails an OTP.
 */
export const signup = createAsyncThunk('auth/signup', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/signup', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Step 2 of signup: POST /auth/verify
 * @param {Object} payload - { email, code } (the OTP from the email)
 * @returns {{ token: string, user: Object }} JWT + user object on success.
 */
export const verify = createAsyncThunk('auth/verify', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Login: POST /auth/login
 * @param {Object} payload - { identifier, password } where identifier is email or username
 * @returns {{ token: string, user: Object }} JWT + user object on success.
 */
export const login = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Forgot password: POST /auth/forgot-password
 * @param {Object} payload - { email }
 * @returns {{ message: string }} Confirmation that a reset code was emailed.
 */
export const forgotPassword = createAsyncThunk('auth/forgot', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Reset password: POST /auth/reset-password
 * @param {Object} payload - { email, code, newPassword }
 * @returns {{ message: string }} Confirmation of successful password reset.
 */
export const resetPassword = createAsyncThunk('auth/reset', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Fetch current user profile: GET /users/me
 * Called on app boot when a stored token exists to restore the session.
 * @returns {Object} The user object.
 */
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

/**
 * Upload schedule: POST /users/me/schedule (multipart form)
 * Parses the uploaded schedule file on the backend, updates enrolledSections,
 * then re-fetches communities so new course rooms appear immediately.
 * @param {File} file - The schedule file to upload.
 * @returns {{ user: Object }} Updated user with new enrolledSections.
 */
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

/**
 * Complete community onboarding: POST /users/me/community-onboarding
 * Marks the user as having finished the post-signup community selection flow.
 * @returns {Object} Updated user object with onboarding flag set.
 */
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

/**
 * Change anonymous username: PATCH /users/me/username
 * Rate-limited to once per week on the backend.
 * @param {string} username - The new anonymous username.
 * @returns {Object} Updated user object.
 */
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
  /** The authenticated user object, or null when logged out. */
  user: null,
  /** JWT stored in localStorage; seeded from storage on load. */
  token: getToken() || null,
  /** True while we resolve a stored token on app boot (shows splash screen). */
  booting: Boolean(getToken()),
  /** Async status for auth operations: 'idle' | 'loading' | 'succeeded' | 'failed'. */
  status: 'idle',
  /** Error message from the most recent failed auth action. */
  error: null,
  /** Transient success message surfaced to the UI (e.g. "Check your email"). */
  notice: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Clear user session: wipe state, remove JWT from storage, disconnect socket. */
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      clearToken();
      disconnectSocket();
    },
    /** Reset transient error and notice so stale messages don't persist across views. */
    clearAuthMessages(state) {
      state.error = null;
      state.notice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Generic matchers for all auth/* thunks ---

      // Any auth thunk pending → set loading, clear previous error.
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      // Any auth thunk rejected → set failed, stop booting, store error message.
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.booting = false;
          state.error = action.payload || 'Request failed.';
        }
      )

      // --- Token-issuing flows (verify + login) ---
      // Store the JWT and user object; persist the token to localStorage.
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

      // --- Profile/user-updating flows (fetchMe, uploadSchedule, changeUsername, completeOnboarding) ---
      // Refresh the user object in state; clear the booting flag.
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

      // --- Cross-slice: optimistic community join ---
      // When a join starts, optimistically add the community id to joinedCommunities.
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
      // When join/leave completes, sync the user object from the server response.
      .addMatcher(
        (action) =>
          ['communities/join/fulfilled', 'communities/leave/fulfilled'].includes(action.type),
        (state, action) => {
          if (action.payload?.user) state.user = action.payload.user;
        }
      )
      // When join is rejected, roll back the optimistic addition.
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

      // --- Non-token flows (signup, forgot, reset) ---
      // These don't issue a JWT; just surface a success notice to the UI.
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
