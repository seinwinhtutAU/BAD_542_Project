const express = require('express');
const { loginWithAd, loginDev, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login/ad', loginWithAd);

// Email/password sign-in is a local development aid. Production authenticates
// through Azure AD only, so the route must not exist there — hiding the form
// from the frontend build does not stop someone calling the API directly.
if (process.env.NODE_ENV !== 'production') {
  router.post('/login/dev', loginDev);
}

router.get('/me', requireAuth, me);

module.exports = router;
