const prisma = require('../config/prisma');
const { getActiveAlerts } = require('./slAlerts.service');
const { summarizeSymptoms } = require('./deepseek.service');
const { isValidSlot } = require('./schedule.service');

function formatSymptomAnalysis(analysis) {
  return [
    'AI symptom analysis:',
    `Summary: ${analysis.summary}`,
    `Urgency: ${analysis.urgency}`,
    `Suggested specialty: ${analysis.suggestedSpecialty}`,
    `Safety note: ${analysis.safetyNote}`,
  ].join('\n');
}

async function createAppointment({
  studentId, doctorId, appointmentDate, symptoms,
}) {
  const when = new Date(appointmentDate);

  if (Number.isNaN(when.getTime())) {
    throw Object.assign(new Error('A valid appointment date and time is required'), { status: 400 });
  }
  if (when.getTime() <= Date.now()) {
    throw Object.assign(new Error('Appointments can only be booked in the future'), { status: 400 });
  }
  // The clinic is open Monday to Friday, 08:30 to 17:00, in half-hour slots.
  // Rejecting anything else here means the rule holds even if a request
  // bypasses the booking form.
  if (!isValidSlot(when)) {
    throw Object.assign(
      new Error('That time is not a clinic consultation slot. The clinic runs Monday to Friday, 08:30 to 17:00, in 30-minute slots.'),
      { status: 400 },
    );
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    throw Object.assign(new Error('Doctor not found'), { status: 404 });
  }

  const alerts = await getActiveAlerts();
  const blockingAlert = alerts.find((a) => a.severity === 'CRITICAL');
  if (blockingAlert) {
    throw Object.assign(new Error(`New appointments are paused: ${blockingAlert.title}`), { status: 409 });
  }

  const analysis = symptoms?.trim() ? await summarizeSymptoms(symptoms) : null;

  try {
    return await prisma.appointment.create({
      data: {
        studentId,
        doctorId,
        appointmentDate: when,
        symptoms: analysis
          ? `${symptoms}\n\n${formatSymptomAnalysis(analysis)}`
          : symptoms,
      },
    });
  } catch (err) {
    // P2002 is the unique index on (doctorId, appointmentDate): somebody took
    // this slot between the form loading and the request arriving.
    if (err.code === 'P2002') {
      throw Object.assign(
        new Error('That slot has just been taken. Please choose another time.'),
        { status: 409 },
      );
    }
    throw err;
  }
}

module.exports = { createAppointment };
