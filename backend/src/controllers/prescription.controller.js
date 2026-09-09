const prisma = require('../config/prisma');

async function create(req, res, next) {
  try {
    const {
      appointmentId, medicine, dosage, instruction,
    } = req.body;

    const id = Number(appointmentId);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'A numeric appointmentId is required' });
    }
    if (!medicine || !dosage) {
      return res.status(400).json({ error: 'medicine and dosage are required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { prescription: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.prescription) {
      return res.status(409).json({
        error: 'This appointment already has a prescription',
      });
    }

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: id, medicine, dosage, instruction,
      },
    });

    await prisma.appointment.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
}

async function getByAppointment(req, res, next) {
  try {
    const appointmentId = Number(req.params.appointmentId);
    if (!Number.isInteger(appointmentId)) {
      return res.status(400).json({ error: 'A numeric appointmentId is required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { prescription: true },
    });

    // A student may only read their own prescription. Answer 404 rather than 403
    // so the response can't be used to probe which appointment ids exist.
    if (!appointment || (req.user.role === 'STUDENT' && appointment.studentId !== req.user.sub)) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (!appointment.prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(appointment.prescription);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'A numeric prescription id is required' });
    }

    const { medicine, dosage, instruction } = req.body;
    if (!medicine || !dosage) {
      return res.status(400).json({ error: 'medicine and dosage are required' });
    }

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { medicine, dosage, instruction },
    });

    res.json(prescription);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, getByAppointment };
