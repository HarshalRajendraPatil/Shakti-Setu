const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Consultation = require('../models/Consultation');
const Report = require('../models/Report');

// Admin dashboard stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalLawyers, pendingLawyers, approvedLawyers, totalConsultations, pendingReports] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Lawyer.countDocuments(),
      Lawyer.countDocuments({ status: 'pending' }),
      Lawyer.countDocuments({ status: 'approved', isSuspended: { $ne: true } }),
      Consultation.countDocuments(),
      Report.countDocuments({ status: 'pending' })
    ]);

    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    const suspendedLawyers = await Lawyer.countDocuments({ isSuspended: true });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalLawyers,
        pendingLawyers,
        approvedLawyers,
        totalConsultations,
        pendingReports,
        suspendedUsers,
        suspendedLawyers
      }
    });
  } catch (error) {
    console.error('Admin getStats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (excluding password)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -__v').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all lawyers
exports.getAllLawyers = async (req, res) => {
  try {
    const lawyers = await Lawyer.find().select('-password -__v').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: lawyers.length,
      lawyers
    });
  } catch (error) {
    console.error('Admin getAllLawyers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user (suspend/activate) - admin cannot suspend another admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isSuspended } = req.body;

    const targetUser = await User.findById(userId).select('-password');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot modify admin user' });
    }

    targetUser.isSuspended = isSuspended === true;
    await targetUser.save();

    res.json({
      success: true,
      message: targetUser.isSuspended ? 'User suspended' : 'User activated',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isSuspended: targetUser.isSuspended
      }
    });
  } catch (error) {
    console.error('Admin updateUserStatus error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Suspend/activate lawyer (for approved lawyers - separate from approve/reject)
exports.updateLawyerSuspension = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { isSuspended } = req.body;

    const lawyer = await Lawyer.findById(lawyerId).select('-password');
    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    lawyer.isSuspended = isSuspended === true;
    await lawyer.save();

    res.json({
      success: true,
      message: lawyer.isSuspended ? 'Lawyer suspended' : 'Lawyer activated',
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        status: lawyer.status,
        isSuspended: lawyer.isSuspended
      }
    });
  } catch (error) {
    console.error('Admin updateLawyerSuspension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const { status, reportType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .populate('reportedLawyer', 'name email barNumber status')
      .populate('reportedUser', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Admin getReports error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resolve or dismiss report
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, adminNotes } = req.body; // action: 'resolved' | 'dismissed'

    if (!['resolved', 'dismissed'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use resolved or dismissed' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    if (report.status !== 'pending') {
      return res.status(400).json({ message: 'Report already processed' });
    }

    report.status = action;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    if (adminNotes) report.adminNotes = adminNotes;
    await report.save();

    await report.populate('reportedBy', 'name email');
    await report.populate('reportedLawyer', 'name email');
    await report.populate('reportedUser', 'name email');
    await report.populate('resolvedBy', 'name');

    res.json({
      success: true,
      message: `Report ${action}`,
      report
    });
  } catch (error) {
    console.error('Admin resolveReport error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
