const prisma = require('../config/prisma');
const { getActiveAlerts } = require('./slAlerts.service');
const { summarizeSymptoms } = require('./deepseek.service');

async function createAppointment({
  studentId, doctorId, appointmentDate, symptoms,
}) {
  const alerts = await getActiveAlerts();
  const blockingAlert = alerts.find((a) => a.severity === 'CRITICAL');
  if (blockingAlert) {
    throw Object.assign(new Error(`New appointments are paused: ${blockingAlert.title}`), { status: 409 });
  }

  const summary = symptoms ? await summarizeSymptoms(symptoms).catch(() => null) : null;

  return prisma.appointment.create({
    data: {
      studentId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      symptoms: summary ? `${symptoms}\n\nAI summary: ${summary}` : symptoms,
    },
  });
}

module.exports = { createAppointment };
