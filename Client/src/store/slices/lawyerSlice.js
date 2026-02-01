import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lawyerAPI } from '../../services/api';

// Async thunks
export const registerLawyer = createAsyncThunk(
  'lawyer/register',
  async (lawyerData, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.register(lawyerData);
      localStorage.setItem('lawyerToken', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginLawyer = createAsyncThunk(
  'lawyer/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.login(credentials);
      localStorage.setItem('lawyerToken', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const getCurrentLawyer = createAsyncThunk(
  'lawyer/getCurrentLawyer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.getMe();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get lawyer');
    }
  }
);

export const getApprovedLawyers = createAsyncThunk(
  'lawyer/getApprovedLawyers',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.getApprovedLawyers(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lawyers');
    }
  }
);

export const getPendingLawyers = createAsyncThunk(
  'lawyer/getPendingLawyers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.getPendingLawyers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending lawyers');
    }
  }
);

export const updateLawyerStatus = createAsyncThunk(
  'lawyer/updateStatus',
  async ({ lawyerId, status, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.updateLawyerStatus(lawyerId, status, rejectionReason);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'lawyer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const getLawyerStats = createAsyncThunk(
  'lawyer/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lawyerAPI.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get stats');
    }
  }
);

const initialState = {
  lawyer: null,
  token: localStorage.getItem('lawyerToken') || null,
  isAuthenticated: !!localStorage.getItem('lawyerToken'),
  approvedLawyers: [],
  pendingLawyers: [],
  loading: false,
  error: null,
};

const lawyerSlice = createSlice({
  name: 'lawyer',
  initialState,
  reducers: {
    logoutLawyer: (state) => {
      state.lawyer = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('lawyerToken');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerLawyer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerLawyer.fulfilled, (state, action) => {
        state.loading = false;
        state.lawyer = action.payload.lawyer;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerLawyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginLawyer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginLawyer.fulfilled, (state, action) => {
        state.loading = false;
        state.lawyer = action.payload.lawyer;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginLawyer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Current Lawyer
      .addCase(getCurrentLawyer.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentLawyer.fulfilled, (state, action) => {
        state.loading = false;
        state.lawyer = action.payload.lawyer;
        const token = localStorage.getItem('lawyerToken');
        state.token = token;
        state.isAuthenticated = !!token;
      })
      .addCase(getCurrentLawyer.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.lawyer = null;
        localStorage.removeItem('lawyerToken');
      })
      // Get Approved Lawyers
      .addCase(getApprovedLawyers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getApprovedLawyers.fulfilled, (state, action) => {
        state.loading = false;
        state.approvedLawyers = action.payload.lawyers;
      })
      .addCase(getApprovedLawyers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Pending Lawyers
      .addCase(getPendingLawyers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPendingLawyers.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingLawyers = action.payload.lawyers;
      })
      .addCase(getPendingLawyers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Status
      .addCase(updateLawyerStatus.fulfilled, (state, action) => {
        const updatedLawyer = action.payload.lawyer;
        // Remove from pending if approved/rejected
        state.pendingLawyers = state.pendingLawyers.filter(
          lawyer => lawyer.id !== updatedLawyer._id
        );
        // Add to approved if approved
        if (updatedLawyer.status === 'approved') {
          state.approvedLawyers.push(updatedLawyer);
        }
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.lawyer = action.payload.lawyer;
      })
      // Get Stats
      .addCase(getLawyerStats.fulfilled, (state, action) => {
        // Stats can be stored in a separate state if needed
      });
  },
});

export const { logoutLawyer, clearError } = lawyerSlice.actions;
export default lawyerSlice.reducer;
