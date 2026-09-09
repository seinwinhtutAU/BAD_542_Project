-- A doctor cannot hold two consultations at the same instant. The booking
-- service checks this too, but the constraint is what makes it impossible
-- when two students submit the same slot at the same moment.
ALTER TABLE `Appointment`
  ADD UNIQUE INDEX `Appointment_doctorId_appointmentDate_key` (`doctorId`, `appointmentDate`);
