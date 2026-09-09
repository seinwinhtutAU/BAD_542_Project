const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { validateAdToken } = require('../services/azureAd.service');

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function loginWithAd(req, res, next) {
  try {
    const { adToken } = req.body;
    const profile = await validateAdToken(adToken);

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: { adId: profile.adId, name: profile.name },
      create: {
        email: profile.email, adId: profile.adId, name: profile.name, role: 'STUDENT',
      },
    });

    res.json({ token: issueToken(user), user });
  } catch (err) {
    next(err);
  }
}

async function loginDev(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: issueToken(user), user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginWithAd, loginDev, me };
