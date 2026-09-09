import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

/** YYYY-MM-DD for a Date, in local time (toISOString would shift the day). */
function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The next weekday from today, since the clinic closes at weekends. */
function firstOpenDay() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return toDateInput(d);
}

/**
 * Replaces the old free datetime field. A student picks a day and then one of
 * the doctor's actual free slots, so an out-of-hours or already-taken time
 * can't be chosen in the first place.
 */
export default function SlotPicker({ doctorId, value, onChange }) {
  const [date, setDate] = useState(firstOpenDay);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId) {
      setSlots([]);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    apiClient
      .get(`/api/doctors/${doctorId}/slots`, { params: { date }, signal: controller.signal })
      .then((res) => setSlots(res.data?.slots || []))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setError(err.response?.data?.error || 'Could not load available times');
        setSlots([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [doctorId, date]);

  // A day change invalidates whatever slot was picked for the previous day.
  function handleDateChange(e) {
    setDate(e.target.value);
    onChange('');
  }

  const openSlots = slots.filter((s) => s.available);
  const today = toDateInput(new Date());

  return (
    <div className="stack-sm">
      <div className="form-group">
        <label className="form-label" htmlFor="slot-date">Appointment date *</label>
        <input
          id="slot-date"
          className="input"
          type="date"
          min={today}
          value={date}
          onChange={handleDateChange}
        />
        <small className="field-hint">
          Clinic hours: Monday – Friday, 08:30 – 17:00. Consultations last 30 minutes.
        </small>
      </div>

      <div className="form-group">
        <span className="form-label">Available times *</span>

        {!doctorId ? (
          <p className="slot-message">Choose a doctor first to see their free times.</p>
        ) : loading ? (
          <p className="slot-message">Loading available times…</p>
        ) : error ? (
          <p className="slot-message slot-message-error">{error}</p>
        ) : slots.length === 0 ? (
          <p className="slot-message">The clinic is closed on this day. Pick a weekday.</p>
        ) : openSlots.length === 0 ? (
          <p className="slot-message">
            Every slot on this day is taken. Try another date.
          </p>
        ) : (
          <>
            <div className="slot-grid">
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  className={`slot-btn ${value === slot.startsAt ? 'selected' : ''}`}
                  disabled={!slot.available}
                  aria-pressed={value === slot.startsAt}
                  title={slot.available ? `Book ${slot.time}` : `${slot.time} is not available`}
                  onClick={() => onChange(slot.startsAt)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            <small className="field-hint">
              {openSlots.length} of {slots.length} slots free. Greyed-out times are already booked or in the past.
            </small>
          </>
        )}
      </div>
    </div>
  );
}
