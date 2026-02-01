const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'lawyer'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  }
}, {
  timestamps: true
});

messageSchema.index({ consultation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
