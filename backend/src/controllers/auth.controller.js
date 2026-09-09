const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { validateAdToken } = require('../services/azureAd.service');
const { publicUserSelect, toPublicUser } = require('../utils/user');

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function loginWithAd(req, res, next) {
  try {
    const { adToken } = req.body;
    const profile = await validateAdToken(adToken);

    // Match on adId first: it is the stable Azure object id. Matching only on
    // email meant that if someone's university address changed, the upsert
    // tried to create a second row carrying their existing (unique) adId,
    // failed the constraint, and locked them out permanently.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ adId: profile.adId }, { email: profile.email }] },
    });

    const user = existing
      ? await prisma.user.update({
        where: { id: existing.id },
        data: { adId: profile.adId, email: profile.email, name: profile.name },
        select: publicUserSelect,
      })
      : await prisma.user.create({
        data: {
          email: profile.email, adId: profile.adId, name: profile.name, role: 'STUDENT',
        },
        select: publicUserSelect,
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

    res.json({ token: issueToken(user), user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: publicUserSelect,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { loginWithAd, loginDev, me };
