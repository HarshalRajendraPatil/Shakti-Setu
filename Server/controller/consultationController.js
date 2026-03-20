const Consultation = require('../models/Consultation');
const Lawyer = require('../models/Lawyer');
const User = require('../models/User');
const Message = require('../models/Message');
const Feedback = require('../models/Feedback');
const { syncLawyerRatingStats } = require('../utils/feedbackAnalytics');

// Create Consultation Request
exports.createConsultation = async (req, res) => {
  try {
    const { lawyerId, subject, description, preferredDate, preferredTime, consultationType } = req.body;
    const userId = req.user.id;

    // Check if lawyer exists and is approved
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }
    if (lawyer.status !== 'approved') {
      return res.status(400).json({ message: 'Lawyer is not approved' });
    }
    if (lawyer.isSuspended) {
      return res.status(400).json({ message: 'This lawyer is currently suspended' });
    }

    // Check if user is trying to consult themselves (if they are a lawyer)
    const requestingUser = await User.findById(userId);
    if (requestingUser && requestingUser.email === lawyer.email) {
      return res.status(400).json({ message: 'You cannot request a consultation with yourself' });
    }

    // User cannot request consultation with same lawyer while a request is still pending (no response yet)
    const existingPending = await Consultation.findOne({
      user: userId,
      lawyer: lawyerId,
      status: 'pending'
    });
    if (existingPending) {
      return res.status(400).json({
        message: 'You already have a pending consultation request with this lawyer. Wait for their response before sending another request.'
      });
    }

    const consultation = new Consultation({
      user: userId,
      lawyer: lawyerId,
      subject,
      description,
      preferredDate,
      preferredTime,
      consultationType: consultationType || 'phone',
      status: 'pending'
    });

    await consultation.save();
    await consultation.populate('user', 'name email phone');
    await consultation.populate('lawyer', 'name email phone barNumber');

    res.status(201).json({
      success: true,
      message: 'Consultation request sent successfully',
      consultation
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get User's Consultations
exports.getUserConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user.id })
      .populate('lawyer', 'name email phone barNumber specialization state city averageRating')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: consultations.length,
      consultations
    });
  } catch (error) {
    console.error('Get user consultations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Lawyer's Consultations
exports.getLawyerConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { lawyer: req.lawyer.id };
    if (status) query.status = status;

    const consultations = await Consultation.find(query)
      .populate('user', 'name email phone age state')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: consultations.length,
      consultations
    });
  } catch (error) {
    console.error('Get lawyer consultations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Consultation Status (Lawyer)
exports.updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status, lawyerResponse } = req.body;

    if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = {
      status,
      respondedAt: new Date()
    };

    if (lawyerResponse) {
      updateData.lawyerResponse = lawyerResponse;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const consultation = await Consultation.findOneAndUpdate(
      { _id: consultationId, lawyer: req.lawyer.id },
      updateData,
      { new: true }
    ).populate('user', 'name email phone').populate('lawyer', 'name email phone barNumber');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // When consultation is marked completed, delete all chat messages (chat is no longer available)
    if (status === 'completed') {
      await Message.deleteMany({ consultation: consultationId });
    }

    res.json({
      success: true,
      message: `Consultation ${status} successfully`,
      consultation
    });
  } catch (error) {
    console.error('Update consultation status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Rating and Review
exports.addRating = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const consultation = await Consultation.findOne({
      _id: consultationId,
      user: req.user.id,
      status: 'completed'
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found or not completed' });
    }

    if (consultation.rating) {
      return res.status(400).json({ message: 'Rating already added' });
    }

    consultation.rating = rating;
    consultation.review = review || '';
    await consultation.save();

    // Mirror consultation rating into the feedback collection for unified analytics.
    await Feedback.findOneAndUpdate(
      {
        consultation: consultation._id,
        submittedByUser: req.user.id
      },
      {
        $set: {
          targetType: 'lawyer',
          lawyer: consultation.lawyer,
          rating,
          comment: review || '',
          categories: ['consultation'],
          source: 'consultation_rating',
          status: 'active',
          metadata: { channel: 'consultation' }
        },
        $setOnInsert: {
          submittedByUser: req.user.id,
          consultation: consultation._id
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await syncLawyerRatingStats(consultation.lawyer);

    res.json({
      success: true,
      message: 'Rating added successfully',
      consultation
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel Consultation (User)
exports.cancelConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.id;

    const consultation = await Consultation.findOne({
      _id: consultationId,
      user: userId
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel a completed or already cancelled consultation' });
    }

    consultation.status = 'cancelled';
    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation cancelled successfully',
      consultation
    });
  } catch (error) {
    console.error('Cancel consultation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Lawyer by ID (Public)
exports.getLawyerById = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const lawyer = await Lawyer.findById(lawyerId)
      .select('-password -__v');

    if (!lawyer || lawyer.status !== 'approved' || lawyer.isSuspended) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    // Get recent reviews
    const reviews = await Consultation.find({
      lawyer: lawyerId,
      rating: { $exists: true, $ne: null }
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('rating review createdAt user');

    res.json({
      success: true,
      lawyer,
      reviews
    });
  } catch (error) {
    console.error('Get lawyer by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
