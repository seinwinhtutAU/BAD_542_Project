const express = require('express');
const { getAppointmentsForPeer } = require('../controllers/alerts.controller');
const { requireApiKey } = require('../middleware/apiKey.middleware');

const router = express.Router();

router.get('/appointments', requireApiKey, getAppointmentsForPeer);

module.exports = router;
