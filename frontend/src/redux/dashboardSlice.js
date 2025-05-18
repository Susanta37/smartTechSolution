import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchDashboard = createAsyncThunk(
  'dashboard/fetchDashboard',
  async ({ filter, date, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = {};
      if (filter) params.filter = filter;
      if (date) params.date = date;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
        params,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    inventory: {
      totalItems: 0,
      lowStock: 0,
      totalStockValue: 0,
      distribution: [],
    },
    financial: {
      deposits: 0,
      withdrawals: 0,
      serviceRevenue: 0,
      transactionFees: 0,
      totalRevenue: 0,
    },
    cash: {
      cashBalance: 0,
      ledgerBalance: 0,
      onlineWalletBalance: 0,
      mainBalance: 0,
      profit: 0,
    },
    commissions: {
      totalUnpaid: 0,
      unpaidCount: 0,
    },
    recentActivity: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetDashboard: (state) => {
      state.inventory = { totalItems: 0, lowStock: 0, totalStockValue: 0, distribution: [] };
      state.financial = { deposits: 0, withdrawals: 0, serviceRevenue: 0, transactionFees: 0, totalRevenue: 0 };
      state.cash = { cashBalance: 0, ledgerBalance: 0, onlineWalletBalance: 0, mainBalance: 0, profit: 0 };
      state.commissions = { totalUnpaid: 0, unpaidCount: 0 };
      state.recentActivity = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.inventory = action.payload.inventory;
        state.financial = action.payload.financial;
        state.cash = action.payload.cash;
        state.commissions = action.payload.commissions;
        state.recentActivity = action.payload.recentActivity;
        state.loading = false;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;