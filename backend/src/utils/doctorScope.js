const prisma = require('../config/prisma');

// A DOCTOR login and a clinic Doctor record are separate rows, joined by
// Doctor.userId. Everything a doctor reads or changes is scoped through this
// helper, so an account that an administrator has not linked yet sees nothing
// rather than every patient in the clinic.
async function doctorIdForUser(user) {
  if (!user || user.role !== 'DOCTOR') return null;
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.sub } });
  return doctor ? doctor.id : null;
}

const UNLINKED_ERROR = 'Your account is not linked to a clinic doctor record yet. Ask an administrator to link it.';

module.exports = { doctorIdForUser, UNLINKED_ERROR };
