import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { MEETING_RULES, MeetingType, conflictsWithExisting, conflictsWithOwnSchedule, groupFor, dropPastSlotsToday } from '@/utils/meetingRules';
import { isOralExamEnabled } from '@/lib/settings';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  const meetingType = searchParams.get('meetingType');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (all) {
    const { rows } = await pool.query(
      'SELECT * FROM slots WHERE date >= $1 ORDER BY date, start_time',
      [todayStr]
    );
    return NextResponse.json(dropPastSlotsToday(rows, now));
  }

  const { rows: availableSlotsRaw } = await pool.query(
    'SELECT * FROM slots WHERE date >= $1 AND is_available = true ORDER BY date, start_time',
    [todayStr]
  );
  const availableSlots = dropPastSlotsToday(availableSlotsRaw, now);

  if (!meetingType || !MEETING_RULES[meetingType as MeetingType]) {
    return NextResponse.json(availableSlots);
  }

  if (meetingType === 'ORAL EXAM' && !(await isOralExamEnabled())) {
    return NextResponse.json([]);
  }

  const rule = MEETING_RULES[meetingType as MeetingType];
  const group = groupFor(meetingType);

  // Pull active (non-cancelled) bookings for every type in this meeting's
  // exclusivity group, so we can exclude slots that would violate the
  // duration+gap rule even though the slot row itself is still is_available.
  const { rows: existingBookings } = await pool.query(
    `SELECT date, start_time, meeting_type FROM bookings
     WHERE status != 'cancelled' AND meeting_type = ANY($1) AND date >= $2`,
    [group, todayStr]
  );

  // Also pull the requesting faculty's OWN bookings across every meeting
  // type, so we never show them a slot that overlaps a meeting they're
  // already in — a faculty member can't be in two places at once, even if
  // the two meeting types aren't in the same exclusivity group.
  const session = await auth();
  const ownEmail = session?.user?.email?.toLowerCase();
  let ownBookings: { date: string; start_time: string; end_time: string }[] = [];
  if (ownEmail) {
    const { rows } = await pool.query(
      `SELECT date, start_time, end_time FROM bookings
       WHERE status != 'cancelled' AND LOWER(emp_email) = $1 AND date >= $2`,
      [ownEmail, todayStr]
    );
    ownBookings = rows;
  }

  const filtered = availableSlots.filter((s) => {
    const timeStr = s.start_time.slice(0, 5);
    if (!rule.allowedTimes.includes(timeStr)) return false;

    const sameDayStr = new Date(s.date).toISOString().split('T')[0];
    const sameDayBookings = existingBookings.filter(
      (b) => new Date(b.date).toISOString().split('T')[0] === sameDayStr
    );
    if (conflictsWithExisting(meetingType, s.start_time, sameDayBookings)) return false;

    const sameDayOwnBookings = ownBookings.filter(
      (b) => new Date(b.date).toISOString().split('T')[0] === sameDayStr
    );
    return !conflictsWithOwnSchedule(meetingType, s.start_time, sameDayOwnBookings);
  });

  return NextResponse.json(filtered);
}

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slots } = await req.json() as {
    slots: { date: string; start_time: string; end_time: string }[];
  };
  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: 'No slots provided' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    const skipped = [];
    for (const s of slots) {
      // ON CONFLICT DO NOTHING: admin cannot create the same date+time slot twice.
      const { rows } = await client.query(
        `INSERT INTO slots (date, start_time, end_time) VALUES ($1, $2, $3)
         ON CONFLICT (date, start_time) DO NOTHING RETURNING *`,
        [s.date, s.start_time, s.end_time]
      );
      if (rows[0]) {
        inserted.push(rows[0]);
      } else {
        skipped.push(`${s.date} ${s.start_time}`);
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ inserted, skipped }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Slot creation failed', err);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await pool.query('DELETE FROM slots WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
