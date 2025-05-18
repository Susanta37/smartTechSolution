import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; 
let initialUser = null;
let initialAuth = false;
const token = localStorage.getItem('token');
if (token) {
  try {
    initialUser = jwtDecode(token);
    initialAuth = true;
  } catch {
    initialUser = null;
    initialAuth = false;
  }
}

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, { email, password });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, userData, {
      headers: { 'x-auth-token': localStorage.getItem('token') },
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
      headers: { 'x-auth-token': localStorage.getItem('token') },
    });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response.data);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: token || null,
    user: initialUser,
    isAuthenticated: initialAuth,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        localStorage.setItem('token', action.payload.token);
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || 'Login failed';
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || 'Registration failed';
      })
       .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || 'Failed to fetch profile';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;