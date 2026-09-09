const prisma = require('../config/prisma');
const { publicUserSelect } = require('../utils/user');

const ROLES = ['STUDENT', 'DOCTOR', 'ADMIN'];

async function listUsers(req, res, next) {
  try {
    res.json(await prisma.user.findMany({ select: publicUserSelect }));
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: publicUserSelect,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'A numeric user id is required' });
    }
    if (id === req.user.sub) {
      return res.status(409).json({ error: 'You cannot delete your own admin account' });
    }

    // Appointments reference the user, so deleting one that still has any would
    // fail on the foreign key with an unreadable Prisma error. Explain instead.
    const appointmentCount = await prisma.appointment.count({ where: { studentId: id } });
    if (appointmentCount > 0) {
      return res.status(409).json({
        error: `This user has ${appointmentCount} appointment(s) and cannot be deleted. Cancel or remove them first.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUserRole, deleteUser };
