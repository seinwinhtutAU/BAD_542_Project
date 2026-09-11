const prisma = require('../config/prisma');
const { getDoctorDaySlots } = require('../services/schedule.service');

// The optional login account behind a clinic record. Returns the column value
// to write, or an error message to send back. An empty value clears the link,
// which is how an administrator hands a room over to a different doctor.
async function resolveLinkedUserId(raw, currentDoctorId) {
  if (raw === undefined) return { value: undefined };
  if (raw === null || raw === '') return { value: null };

  const userId = Number(raw);
  if (!Number.isInteger(userId)) {
    return { error: 'userId must be a number' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { doctor: true } });
  if (!user) {
    return { error: 'That user account does not exist' };
  }
  if (user.role !== 'DOCTOR') {
    return { error: `${user.name} has the ${user.role} role. Change their role to DOCTOR first.` };
  }
  if (user.doctor && user.doctor.id !== currentDoctorId) {
    return { error: `That account is already linked to Dr. ${user.doctor.name}.` };
  }

  return { value: userId };
}

async function listDoctors(req, res, next) {
  try {
    res.json(await prisma.doctor.findMany());
  } catch (err) {
    next(err);
  }
}

async function createDoctor(req, res, next) {
  try {
    const { name, specialty, room } = req.body;

    const link = await resolveLinkedUserId(req.body.userId, null);
    if (link.error) {
      return res.status(400).json({ error: link.error });
    }

    const doctor = await prisma.doctor.create({
      data: {
        name, specialty, room, userId: link.value ?? null,
      },
    });
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  try {
    // Only these columns are client-editable; passing req.body straight through
    // would let a caller set any column, including the primary key.
    const { name, specialty, room } = req.body;
    const id = Number(req.params.id);

    const link = await resolveLinkedUserId(req.body.userId, id);
    if (link.error) {
      return res.status(400).json({ error: link.error });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name, specialty, room, ...(link.value === undefined ? {} : { userId: link.value }),
      },
    });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'A numeric doctor id is required' });
    }

    const appointmentCount = await prisma.appointment.count({ where: { doctorId: id } });
    if (appointmentCount > 0) {
      return res.status(409).json({
        error: `This doctor has ${appointmentCount} appointment(s) and cannot be deleted. Cancel or reassign them first.`,
      });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    await prisma.doctor.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/** The day's consultation slots for one doctor, each marked free or taken. */
async function listDoctorSlots(req, res, next) {
  try {
    const doctorId = Number(req.params.id);
    if (!Number.isInteger(doctorId)) {
      return res.status(400).json({ error: 'A numeric doctor id is required' });
    }

    const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      return res.status(400).json({ error: 'A date query param of the form YYYY-MM-DD is required' });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ date, slots: await getDoctorDaySlots(doctorId, date) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDoctors, listDoctorSlots, createDoctor, updateDoctor, deleteDoctor,
};
