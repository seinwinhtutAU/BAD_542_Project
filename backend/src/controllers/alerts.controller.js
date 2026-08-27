const prisma = require('../config/prisma');

async function getAppointmentsForPeer(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date query param is required' });
    }

    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: { appointmentDate: { gte: start, lt: end }, status: { not: 'CANCELLED' } },
      include: { student: { select: { name: true, email: true } } },
    });

    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAppointmentsForPeer };
