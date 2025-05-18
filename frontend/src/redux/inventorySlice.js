import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inventory');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'inventory/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    lowStock: [],
    categories: [],
    loading: false,
    loadingCategories: false,
    error: null,
    errorCategories: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        // Filter out items with invalid categoryId
        const validItems = action.payload.filter(
          (item) => item.categoryId && typeof item.categoryId === 'object' && item.categoryId.name
        );
        state.items = validItems;
        state.lowStock = validItems.filter((item) => item.quantity < 130); 
        state.loading = false;
        if (action.payload.length !== validItems.length) {
          console.warn('Some inventory items were filtered out due to invalid categoryId');
        }
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategories.pending, (state) => {
        state.loadingCategories = true;
        state.errorCategories = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loadingCategories = false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loadingCategories = false;
        state.errorCategories = action.payload;
      });
  },
});

export default inventorySlice.reducer;