const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String
  },
  consultationType: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'email'],
    default: 'phone'
  },
  lawyerResponse: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    default: ''
  },
  respondedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
consultationSchema.index({ lawyer: 1, status: 1 });
consultationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
