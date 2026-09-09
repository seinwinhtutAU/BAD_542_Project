const prisma = require('../config/prisma');
const { getDoctorDaySlots } = require('../services/schedule.service');

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
    res.status(201).json(await prisma.doctor.create({ data: { name, specialty, room } }));
  } catch (err) {
    next(err);
  }
}

async function updateDoctor(req, res, next) {
  try {
    // Only these three columns are client-editable; passing req.body straight
    // through would let a caller set any column, including the primary key.
    const { name, specialty, room } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: Number(req.params.id) },
      data: { name, specialty, room },
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
