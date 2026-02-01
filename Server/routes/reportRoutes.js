const express = require('express');
const router = express.Router();
const { reportLawyer, reportUser } = require('../controller/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/lawyer', authMiddleware, reportLawyer);
router.post('/user', authMiddleware, reportUser);

module.exports = router;
