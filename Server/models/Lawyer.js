const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const lawyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  barNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  specialization: {
    type: [String],
    required: true,
    default: []
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  education: {
    type: [String],
    default: []
  },
  languages: {
    type: [String],
    default: ['English', 'Hindi']
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: {
    monday: { available: Boolean, hours: String },
    tuesday: { available: Boolean, hours: String },
    wednesday: { available: Boolean, hours: String },
    thursday: { available: Boolean, hours: String },
    friday: { available: Boolean, hours: String },
    saturday: { available: Boolean, hours: String },
    sunday: { available: Boolean, hours: String }
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalConsultations: {
    type: Number,
    default: 0
  },
  isSuspended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
lawyerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
lawyerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Lawyer', lawyerSchema);
