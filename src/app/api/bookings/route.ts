import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { MEETING_RULES, MeetingType, conflictsWithExisting, conflictsWithOwnSchedule, groupFor } from '@/utils/meetingRules';
import { notifyAdminOfNewBooking } from '@/lib/mail';
import { isOralExamEnabled } from '@/lib/settings';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT * FROM bookings WHERE LOWER(emp_email) = LOWER($1)
     ORDER BY date ASC, start_time ASC`,
    [session.user.email]
  );
  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookingId, action } = await req.json();
  if (action !== 'cancel') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Only let a user cancel their own booking.
    const { rows } = await client.query(
      `UPDATE bookings SET status = 'cancelled'
       WHERE id = $1 AND LOWER(emp_email) = LOWER($2)
       RETURNING *`,
      [bookingId, session.user.email]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const cancelled = rows[0];

    // Only re-release the slot for others to book if its start time is
    // still 24+ hours away — a last-minute cancellation shouldn't let
    // someone else grab a slot that's about to happen.
    const slotStart = new Date(`${new Date(cancelled.date).toISOString().split('T')[0]}T${cancelled.start_time}`);
    const hoursUntilSlot = (slotStart.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilSlot >= 24) {
      await client.query(
        'UPDATE slots SET is_available = true WHERE id = $1',
        [cancelled.slot_id]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json(cancelled);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel failed', err);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'You must be logged in to book.' }, { status: 401 });
  }

  const body = await req.json();
  const { slotId, empId, empName, scholarId, scholarName, meetingType } = body;

  const rule = MEETING_RULES[meetingType as MeetingType];
  if (!rule) {
    return NextResponse.json({ error: 'Invalid meeting type.' }, { status: 400 });
  }

  if (meetingType === 'ORAL EXAM' && !(await isOralExamEnabled())) {
    return NextResponse.json(
      { error: 'Oral Exam bookings are currently disabled by the admin.' },
      { status: 403 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Atomically claim the slot: fails if someone else already booked it,
    // closing the race condition from the old Supabase flow (separate insert + update).
    const slotResult = await client.query(
      `UPDATE slots SET is_available = false
       WHERE id = $1 AND is_available = true
       RETURNING *`,
      [slotId]
    );

    if (slotResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Slot is no longer available.' }, { status: 409 });
    }

    const slot = slotResult.rows[0];
    const timeStr = (slot.start_time as string).slice(0, 5);

    if (!rule.allowedTimes.includes(timeStr)) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: `${meetingType} can only be booked at: ${rule.allowedTimes.join(', ')}` },
        { status: 400 }
      );
    }

    const group = groupFor(meetingType);
    const { rows: existingBookings } = await client.query(
      `SELECT date, start_time, meeting_type FROM bookings
       WHERE status != 'cancelled' AND meeting_type = ANY($1) AND date = $2`,
      [group, slot.date]
    );

    if (conflictsWithExisting(meetingType, slot.start_time, existingBookings)) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'This time conflicts with another meeting of the same type. Please pick a different slot.' },
        { status: 409 }
      );
    }

    // A faculty member can't be in two meetings at once, even across
    // different meeting types — check their own schedule directly.
    const { rows: ownBookings } = await client.query(
      `SELECT start_time, end_time FROM bookings
       WHERE status != 'cancelled' AND LOWER(emp_email) = LOWER($1) AND date = $2`,
      [session.user.email, slot.date]
    );

    if (conflictsWithOwnSchedule(meetingType, slot.start_time, ownBookings)) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'You already have a meeting booked at this time. Please pick a different slot.' },
        { status: 409 }
      );
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings
        (slot_id, title, date, start_time, end_time, location, status,
         emp_id, emp_name, scholar_id, scholar_name, meeting_type, emp_email)
       VALUES ($1, $2, $3, $4, $5, 'TBD', 'pending', $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        slot.id,
        meetingType,
        slot.date,
        slot.start_time,
        slot.end_time,
        empId,
        empName,
        scholarId,
        scholarName,
        meetingType,
        session.user.email.toLowerCase(),
      ]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];
    notifyAdminOfNewBooking({
      facultyEmail: session.user.email.toLowerCase(),
      facultyName: empName,
      meetingType,
      date: new Date(slot.date).toISOString().split('T')[0],
      startTime: (slot.start_time as string).slice(0, 5),
      endTime: (slot.end_time as string).slice(0, 5),
      scholarName,
      scholarId,
    }).catch((err) => console.error('Failed to send admin notification email', err));

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking failed', err);
    return NextResponse.json({ error: 'Failed to create booking.' }, { status: 500 });
  } finally {
    client.release();
  }
}
