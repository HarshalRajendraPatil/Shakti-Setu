const express = require('express');
const router = express.Router();
const { getResources } = require('../controller/resourcesController');

router.get('/', getResources);

module.exports = router;
