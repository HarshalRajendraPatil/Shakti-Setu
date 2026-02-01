const express = require('express');
const router = express.Router();
const {
  getStats,
  getAllUsers,
  getAllLawyers,
  updateUserStatus,
  updateLawyerSuspension,
  getReports,
  resolveReport
} = require('../controller/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/lawyers', getAllLawyers);
router.put('/users/:userId/status', updateUserStatus);
router.put('/lawyers/:lawyerId/suspend', updateLawyerSuspension);
router.get('/reports', getReports);
router.put('/reports/:reportId/resolve', resolveReport);

module.exports = router;
