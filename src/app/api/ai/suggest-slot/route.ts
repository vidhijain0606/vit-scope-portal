import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { azureChat } from '@/lib/azureAi';
import { MEETING_RULES, MeetingType, conflictsWithExisting, conflictsWithOwnSchedule, groupFor, dropPastSlotsToday } from '@/utils/meetingRules';
import { isOralExamEnabled } from '@/lib/settings';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meetingType } = await req.json();
  const rule = MEETING_RULES[meetingType as MeetingType];
  if (!rule) {
    return NextResponse.json({ error: 'Invalid meeting type.' }, { status: 400 });
  }

  if (meetingType === 'ORAL EXAM' && !(await isOralExamEnabled())) {
    return NextResponse.json({ suggestion: null, reason: 'Oral Exam bookings are currently disabled by the admin.' });
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const { rows: availableSlotsRaw } = await pool.query(
    'SELECT * FROM slots WHERE date >= $1 AND is_available = true ORDER BY date, start_time LIMIT 100',
    [todayStr]
  );
  const availableSlots = dropPastSlotsToday(availableSlotsRaw, now);

  const group = groupFor(meetingType);
  const { rows: existingBookings } = await pool.query(
    `SELECT date, start_time, meeting_type FROM bookings
     WHERE status != 'cancelled' AND meeting_type = ANY($1) AND date >= $2`,
    [group, todayStr]
  );

  const { rows: ownBookings } = await pool.query(
    `SELECT date, start_time, end_time FROM bookings
     WHERE status != 'cancelled' AND LOWER(emp_email) = LOWER($1) AND date >= $2`,
    [session.user.email, todayStr]
  );

  const candidates = availableSlots.filter((s) => {
    const timeStr = (s.start_time as string).slice(0, 5);
    if (!rule.allowedTimes.includes(timeStr)) return false;
    const sameDayStr = new Date(s.date).toISOString().split('T')[0];
    const sameDay = existingBookings.filter(
      (b) => new Date(b.date).toISOString().split('T')[0] === sameDayStr
    );
    if (conflictsWithExisting(meetingType, s.start_time, sameDay)) return false;

    const sameDayOwn = ownBookings.filter(
      (b) => new Date(b.date).toISOString().split('T')[0] === sameDayStr
    );
    return !conflictsWithOwnSchedule(meetingType, s.start_time, sameDayOwn);
  });

  if (candidates.length === 0) {
    return NextResponse.json({ suggestion: null, reason: 'No valid slots available for this meeting type.' });
  }

  try {
    const listForPrompt = candidates
      .slice(0, 15)
      .map((s) => `${new Date(s.date).toISOString().split('T')[0]} at ${(s.start_time as string).slice(0, 5)}`)
      .join('\n');

    const reply = await azureChat([
      {
        role: 'system',
        content: `You pick the single best slot for a ${meetingType} from a candidate list. Prefer the soonest upcoming date and a mid-morning or early-afternoon time when possible. Respond with ONLY the chosen line exactly as given, nothing else.`,
      },
      { role: 'user', content: listForPrompt },
    ], 300);

    const chosen = candidates.find((s) => {
      const dateStr = new Date(s.date).toISOString().split('T')[0];
      const timeStr = (s.start_time as string).slice(0, 5);
      return reply.includes(dateStr) && reply.includes(timeStr);
    }) ?? candidates[0];

    return NextResponse.json({ suggestion: chosen });
  } catch (err) {
    console.error('AI suggestion failed, falling back to earliest slot', err);
    // Graceful degrade: AI unavailable doesn't break the booking flow.
    return NextResponse.json({ suggestion: candidates[0] });
  }
}
