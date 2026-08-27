const prisma = require('../config/prisma');

async function listUsers(req, res, next) {
  try {
    res.json(await prisma.user.findMany());
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role: req.body.role },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserRole, deleteUser };
