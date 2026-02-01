const Report = require('../models/Report');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

// User reports a lawyer
exports.reportLawyer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lawyerId, reason, description } = req.body;

    if (!lawyerId || !reason || !reason.trim()) {
      return res.status(400).json({ message: 'Lawyer ID and reason are required' });
    }

    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    const report = new Report({
      reportedBy: userId,
      reportType: 'lawyer',
      reportedLawyer: lawyerId,
      reason: reason.trim(),
      description: (description || '').trim(),
      status: 'pending'
    });
    await report.save();
    await report.populate('reportedLawyer', 'name email barNumber');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Admin will review it.',
      report: {
        id: report._id,
        reportType: report.reportType,
        reason: report.reason,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Report lawyer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// User reports another user (e.g. from consultation context)
exports.reportUser = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { userId, reason, description } = req.body;

    if (!userId || !reason || !reason.trim()) {
      return res.status(400).json({ message: 'User ID and reason are required' });
    }

    const reportedUser = await User.findById(userId).select('-password');
    if (!reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (reportedUser._id.toString() === reporterId) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }
    if (reportedUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot report admin' });
    }

    const report = new Report({
      reportedBy: reporterId,
      reportType: 'user',
      reportedUser: userId,
      reason: reason.trim(),
      description: (description || '').trim(),
      status: 'pending'
    });
    await report.save();
    await report.populate('reportedUser', 'name email');

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Admin will review it.',
      report: {
        id: report._id,
        reportType: report.reportType,
        reason: report.reason,
        status: report.status
      }
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
