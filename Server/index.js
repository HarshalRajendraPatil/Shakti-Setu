const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { startFeedbackReportScheduler } = require('./jobs/feedbackReportJob');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/lawyers', require('./routes/lawyerRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/resources', require('./routes/resourcesRoutes'));
app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shakti-setu');
    console.log('MongoDB Connected');
    startFeedbackReportScheduler();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
