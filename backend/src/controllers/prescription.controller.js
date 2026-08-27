const prisma = require('../config/prisma');

async function create(req, res, next) {
  try {
    const {
      appointmentId, medicine, dosage, instruction,
    } = req.body;

    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: Number(appointmentId), medicine, dosage, instruction,
      },
    });

    await prisma.appointment.update({
      where: { id: Number(appointmentId) },
      data: { status: 'COMPLETED' },
    });

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
}

async function getByAppointment(req, res, next) {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { appointmentId: Number(req.params.appointmentId) },
    });
    res.json(prescription);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getByAppointment };
