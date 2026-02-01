const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['lawyer', 'user'],
    required: true
  },
  reportedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    default: null
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

reportSchema.index({ status: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ reportedLawyer: 1 });
reportSchema.index({ reportedUser: 1 });

module.exports = mongoose.model('Report', reportSchema);
