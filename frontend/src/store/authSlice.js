import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { toast } from 'react-toastify';

const initialToken = localStorage.getItem('erp_token');
const initialUser = localStorage.getItem('erp_user') ? JSON.parse(localStorage.getItem('erp_user')) : null;

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('erp_token', res.data.token);
    localStorage.setItem('erp_user', JSON.stringify(res.data.user));
    toast.success(`Welcome back, ${res.data.user.full_name}!`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.message || 'Login failed');
  }
});

export const switchDemoRole = createAsyncThunk('auth/switchDemoRole', async (email, { dispatch }) => {
  return await dispatch(loginUser({ email, password: 'Demo@123' })).unwrap();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      toast.info('Logged out successfully');
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('erp_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;

