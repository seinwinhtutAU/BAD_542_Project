import React from 'react';

/**
 * The paper version. Hidden on screen and revealed by the print stylesheet,
 * so a student can take a legible slip to the pharmacy instead of a
 * screenshot of a dark dashboard.
 */
export default function PrescriptionSlip({ appointment, prescription, patientName }) {
  if (!prescription) return null;

  const issued = new Date(appointment.appointmentDate);

  return (
    <div className="print-slip" aria-hidden="true">
      <header className="print-slip-head">
        <div>
          <h1>Campus Health Clinic</h1>
          <p>University Medical System</p>
        </div>
        <div className="print-slip-ref">
          <div>Prescription #{prescription.id}</div>
          <div>Appointment #{appointment.id}</div>
        </div>
      </header>

      <dl className="print-slip-meta">
        <div>
          <dt>Patient</dt>
          <dd>{patientName || appointment.student?.name || '—'}</dd>
        </div>
        <div>
          <dt>Prescribing doctor</dt>
          <dd>Dr. {appointment.doctor?.name} — {appointment.doctor?.specialty}</dd>
        </div>
        <div>
          <dt>Consultation date</dt>
          <dd>{issued.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
        </div>
        <div>
          <dt>Clinic room</dt>
          <dd>{appointment.doctor?.room || '—'}</dd>
        </div>
      </dl>

      <section className="print-slip-body">
        <h2>Prescription</h2>
        <div className="print-slip-medicine">{prescription.medicine}</div>
        <p><strong>Dosage:</strong> {prescription.dosage}</p>
        <p><strong>Instructions:</strong> {prescription.instruction || 'Take as directed by your doctor.'}</p>
      </section>

      <footer className="print-slip-foot">
        <div className="print-slip-sign">
          <span>Doctor's signature</span>
        </div>
        <p className="print-slip-note">
          Printed from the Campus Health portal on{' '}
          {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.
          Present this slip at the campus pharmacy.
        </p>
      </footer>
    </div>
  );
}
