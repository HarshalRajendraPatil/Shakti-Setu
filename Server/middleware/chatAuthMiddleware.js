const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

// Accepts either user token or lawyer token; sets req.chatActor = { type, id }
const chatAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type === 'user') {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return res.status(401).json({ message: 'Token is not valid' });
      req.user = user;
      req.chatActor = { type: 'user', id: user._id.toString() };
    } else if (decoded.type === 'lawyer') {
      const lawyer = await Lawyer.findById(decoded.lawyerId).select('-password');
      if (!lawyer) return res.status(401).json({ message: 'Token is not valid' });
      req.lawyer = lawyer;
      req.chatActor = { type: 'lawyer', id: lawyer._id.toString() };
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = chatAuthMiddleware;
