const express = require('express');
const router = express.Router();
const { getDemographicInsights } = require('../controller/dashboardController');
const {authMiddleware} = require('../middleware/authMiddleware');

router.get('/insights', authMiddleware, getDemographicInsights);

module.exports = router;
