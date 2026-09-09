const prisma = require('../config/prisma');

/**
 * Clinic opening hours, as advertised on the booking form:
 * Monday – Friday, 08:30 – 17:00. Consultations are half an hour, and the
 * last one starts at 16:30 so it finishes before the clinic closes.
 */
const CLINIC = {
  openMinutes: 8 * 60 + 30,
  closeMinutes: 17 * 60,
  slotMinutes: 30,
  openDays: [1, 2, 3, 4, 5],
};

function minutesToLabel(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Every slot the clinic could offer on the given day, open or not. */
function slotsForDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime()) || !CLINIC.openDays.includes(date.getDay())) {
    return [];
  }

  const slots = [];
  for (let m = CLINIC.openMinutes; m + CLINIC.slotMinutes <= CLINIC.closeMinutes; m += CLINIC.slotMinutes) {
    slots.push({
      time: minutesToLabel(m),
      startsAt: new Date(year, month - 1, day, Math.floor(m / 60), m % 60, 0, 0),
    });
  }
  return slots;
}

/** True when the instant lands exactly on a bookable clinic slot. */
function isValidSlot(when) {
  const date = new Date(when);
  if (Number.isNaN(date.getTime())) return false;

  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return slotsForDate(dateString).some((slot) => slot.startsAt.getTime() === date.getTime());
}

/**
 * The day's slots for one doctor, each marked taken or free. A slot in the
 * past is reported as unavailable so the UI can't offer it.
 */
async function getDoctorDaySlots(doctorId, dateString) {
  const slots = slotsForDate(dateString);
  if (slots.length === 0) return [];

  const dayStart = slots[0].startsAt;
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const taken = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: dayStart, lte: dayEnd },
      status: { not: 'CANCELLED' },
    },
    select: { appointmentDate: true },
  });

  const takenTimes = new Set(taken.map((a) => new Date(a.appointmentDate).getTime()));
  const now = Date.now();

  return slots.map((slot) => ({
    time: slot.time,
    startsAt: slot.startsAt.toISOString(),
    available: !takenTimes.has(slot.startsAt.getTime()) && slot.startsAt.getTime() > now,
  }));
}

module.exports = {
  CLINIC, slotsForDate, isValidSlot, getDoctorDaySlots,
};
