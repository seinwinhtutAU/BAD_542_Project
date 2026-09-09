const prisma = require('../config/prisma');
const { createAppointment } = require('../services/appointment.service');
const { publicUserSelect } = require('../utils/user');

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

async function create(req, res, next) {
  try {
    const appointment = await createAppointment({
      studentId: req.user.sub,
      doctorId: Number(req.body.doctorId),
      appointmentDate: req.body.appointmentDate,
      symptoms: req.body.symptoms,
    });
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { studentId: req.user.sub },
      include: { doctor: true, prescription: true },
      orderBy: { appointmentDate: 'desc' },
    });
    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { student: { select: publicUserSelect }, doctor: true, prescription: true },
      orderBy: { appointmentDate: 'desc' },
    });
    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'A numeric appointment id is required' });
    }

    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
    }

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } });
    if (!appointment || (req.user.role === 'STUDENT' && appointment.studentId !== req.user.sub)) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create, listMine, listAll, updateStatus, cancel,
};
