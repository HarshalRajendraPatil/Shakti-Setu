import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import lawyerSlice from './slices/lawyerSlice';
import consultationSlice from './slices/consultationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    lawyer: lawyerSlice,
    consultation: consultationSlice,
  },
});
