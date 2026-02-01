const jwt = require('jsonwebtoken');
const Lawyer = require('../models/Lawyer');

const lawyerAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if token is for lawyer
    if (decoded.type !== 'lawyer') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    const lawyer = await Lawyer.findById(decoded.lawyerId).select('-password');
    
    if (!lawyer) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.lawyer = lawyer;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = lawyerAuthMiddleware;
