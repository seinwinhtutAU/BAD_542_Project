const express = require('express');
const { loginWithAd, loginDev, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login/ad', loginWithAd);
router.post('/login/dev', loginDev);
router.get('/me', requireAuth, me);

module.exports = router;
