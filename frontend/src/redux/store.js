import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import inventoryReducer from './inventorySlice';
import dashboardReducer from './dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    inventory: inventoryReducer,
    dashboard: dashboardReducer,
  },
});

export default store;