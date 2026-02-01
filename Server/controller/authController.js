const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId, type: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, age, state } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      age,
      state
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        state: user.state,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact admin.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        state: user.state,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        state: user.state,
        role: user.role,
        isSuspended: user.isSuspended
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update User Profile (name, phone, age, state only)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, age, state } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (age !== undefined) updateData.age = age;
    if (state !== undefined) updateData.state = state;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        state: user.state,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Saved Lawyers (bookmark lawyers for later)
exports.getSavedLawyers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedLawyers').populate('savedLawyers', 'name email phone barNumber specialization experience state city averageRating totalRatings status isSuspended');
    const lawyers = (user.savedLawyers || []).filter(l => l && l.status === 'approved' && !l.isSuspended);
    res.json({
      success: true,
      lawyers
    });
  } catch (error) {
    console.error('Get saved lawyers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addSavedLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const Lawyer = require('../models/Lawyer');
    const lawyer = await Lawyer.findById(lawyerId).select('_id status');
    if (!lawyer) return res.status(404).json({ message: 'Lawyer not found' });
    if (lawyer.status !== 'approved') return res.status(400).json({ message: 'Can only save approved lawyers' });

    const user = await User.findById(req.user.id).select('savedLawyers');
    const idStr = lawyerId.toString();
    if (user.savedLawyers.some(id => id.toString() === idStr)) {
      return res.json({ success: true, message: 'Already saved', savedLawyerIds: user.savedLawyers });
    }
    user.savedLawyers.push(lawyerId);
    await user.save();

    res.json({
      success: true,
      message: 'Lawyer saved',
      savedLawyerIds: user.savedLawyers
    });
  } catch (error) {
    console.error('Add saved lawyer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.removeSavedLawyer = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const user = await User.findById(req.user.id).select('savedLawyers');
    user.savedLawyers = user.savedLawyers.filter(id => id.toString() !== lawyerId);
    await user.save();

    res.json({
      success: true,
      message: 'Lawyer removed from saved',
      savedLawyerIds: user.savedLawyers
    });
  } catch (error) {
    console.error('Remove saved lawyer error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
