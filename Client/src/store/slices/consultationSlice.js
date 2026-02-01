import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { consultationAPI } from '../../services/api';

// Async thunks
export const createConsultation = createAsyncThunk(
  'consultation/create',
  async (consultationData, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.createConsultation(consultationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create consultation');
    }
  }
);

export const getUserConsultations = createAsyncThunk(
  'consultation/getUserConsultations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.getUserConsultations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch consultations');
    }
  }
);

export const getLawyerConsultations = createAsyncThunk(
  'consultation/getLawyerConsultations',
  async (status, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.getLawyerConsultations(status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch consultations');
    }
  }
);

export const updateConsultationStatus = createAsyncThunk(
  'consultation/updateStatus',
  async ({ consultationId, status, lawyerResponse }, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.updateConsultationStatus(consultationId, status, lawyerResponse);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update consultation');
    }
  }
);

export const addRating = createAsyncThunk(
  'consultation/addRating',
  async ({ consultationId, rating, review }, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.addRating(consultationId, rating, review);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add rating');
    }
  }
);

export const getLawyerById = createAsyncThunk(
  'consultation/getLawyerById',
  async (lawyerId, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.getLawyerById(lawyerId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch lawyer');
    }
  }
);

export const cancelConsultation = createAsyncThunk(
  'consultation/cancel',
  async (consultationId, { rejectWithValue }) => {
    try {
      const response = await consultationAPI.cancelConsultation(consultationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel consultation');
    }
  }
);

const initialState = {
  consultations: [],
  lawyerDetail: null,
  reviews: [],
  loading: false,
  error: null,
};

const consultationSlice = createSlice({
  name: 'consultation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLawyerDetail: (state) => {
      state.lawyerDetail = null;
      state.reviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Consultation
      .addCase(createConsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConsultation.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations.unshift(action.payload.consultation);
      })
      .addCase(createConsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get User Consultations
      .addCase(getUserConsultations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserConsultations.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations = action.payload.consultations;
      })
      .addCase(getUserConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Lawyer Consultations
      .addCase(getLawyerConsultations.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLawyerConsultations.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations = action.payload.consultations;
      })
      .addCase(getLawyerConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Status
      .addCase(updateConsultationStatus.fulfilled, (state, action) => {
        const index = state.consultations.findIndex(
          c => c._id === action.payload.consultation._id
        );
        if (index !== -1) {
          state.consultations[index] = action.payload.consultation;
        }
      })
      // Add Rating
      .addCase(addRating.fulfilled, (state, action) => {
        const index = state.consultations.findIndex(
          c => c._id === action.payload.consultation._id
        );
        if (index !== -1) {
          state.consultations[index] = action.payload.consultation;
        }
      })
      // Cancel Consultation (User)
      .addCase(cancelConsultation.fulfilled, (state, action) => {
        const index = state.consultations.findIndex(
          c => c._id === action.payload.consultation._id
        );
        if (index !== -1) {
          state.consultations[index] = action.payload.consultation;
        }
      })
      // Get Lawyer By ID
      .addCase(getLawyerById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getLawyerById.fulfilled, (state, action) => {
        state.loading = false;
        state.lawyerDetail = action.payload.lawyer;
        state.reviews = action.payload.reviews || [];
      })
      .addCase(getLawyerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearLawyerDetail } = consultationSlice.actions;
export default consultationSlice.reducer;
