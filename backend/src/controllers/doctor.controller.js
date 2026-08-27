const prisma = require('../config/prisma');

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
    const doctor = await prisma.doctor.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
}

async function deleteDoctor(req, res, next) {
  try {
    await prisma.doctor.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDoctors, createDoctor, updateDoctor, deleteDoctor,
};
