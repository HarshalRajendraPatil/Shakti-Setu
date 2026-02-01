const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, getSavedLawyers, addSavedLawyer, removeSavedLawyer } = require('../controller/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.get('/saved-lawyers', authMiddleware, getSavedLawyers);
router.post('/saved-lawyers/:lawyerId', authMiddleware, addSavedLawyer);
router.delete('/saved-lawyers/:lawyerId', authMiddleware, removeSavedLawyer);

module.exports = router;
