import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { azureChat } from '@/lib/azureAi';
import { MEETING_RULES, MEETING_TYPES, MeetingType, conflictsWithExisting, conflictsWithOwnSchedule, groupFor, dropPastSlotsToday } from '@/utils/meetingRules';
import { isOralExamEnabled } from '@/lib/settings';

const SYSTEM_PROMPT = `You are the assistant for the VIT SCOPE Research Portal, a DAC/synopsis/colloquium/oral-exam/comprehensive-viva scheduling tool for VIT faculty.
Help users understand how to book slots, find their bookings, upload/view documents, and explain meeting-type time rules:
- DC MEETING / COMPREHENSIVE VIVA: 10:00, 11:00, 11:30, 12:00, 15:00, 15:30, 16:00 (1 hour each, 1 hour gap between consecutive DC meetings)
- COLLOQUIUM: 11:00, 11:30, 15:00, 15:30 (30 min each)
- SYNOPSIS MEETING / ORAL EXAM: 10:00, 11:30, 14:30, 16:00 (1.5 hours each)
Keep answers brief and specific to this portal. If asked something unrelated, politely redirect to portal topics.`;

// Matches an admin one-line command like:
// "add slot 2026-10-20 10:00-11:00" or "add slot on 2026-10-20 from 10:00 to 11:00"
const ADD_SLOT_RE = /add\s+slots?\s*(?:on)?\s*(\d{4}-\d{2}-\d{2})\s*(?:from)?\s*(\d{1,2}:\d{2})\s*(?:-|to)\s*(\d{1,2}:\d{2})/i;

async function handleAddSlotCommand(match: RegExpMatchArray) {
  const [, date, start, end] = match;
  const startTime = start.length === 4 ? `0${start}` : start;
  const endTime = end.length === 4 ? `0${end}` : end;

  const { rows } = await pool.query(
    `INSERT INTO slots (date, start_time, end_time) VALUES ($1, $2, $3)
     ON CONFLICT (date, start_time) DO NOTHING RETURNING *`,
    [date, startTime, endTime]
  );

  if (rows[0]) {
    return `Created a new slot on ${date} from ${startTime} to ${endTime}.`;
  }
  return `A slot on ${date} at ${startTime} already exists — nothing changed.`;
}

async function handleSuggestionRequest(meetingType: MeetingType, facultyEmail: string) {
  if (meetingType === 'ORAL EXAM' && !(await isOralExamEnabled())) {
    return 'Oral Exam bookings are currently disabled by the admin. Try a different meeting type, or check back later.';
  }

  const rule = MEETING_RULES[meetingType];
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
    [facultyEmail, todayStr]
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
    return `I couldn't find any open slots for ${meetingType} right now. Try a different meeting type or check back later.`;
  }

  const top = candidates.slice(0, 3).map((s) => {
    const dateStr = new Date(s.date).toISOString().split('T')[0];
    const timeStr = (s.start_time as string).slice(0, 5);
    return `${dateStr} at ${timeStr}`;
  });

  return `Here are the best open slots for ${meetingType}:\n${top.map((t) => `• ${t}`).join('\n')}\n\nGo to Book a Slot and use "Suggest best slot" or pick one of these from the calendar to confirm.`;
}

function findMentionedMeetingType(message: string): MeetingType | null {
  const lower = message.toLowerCase();
  return MEETING_TYPES.find((t) => lower.includes(t.toLowerCase())) ?? null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const isAdmin = (session.user as { role?: string }).role === 'admin';

  try {
    if (isAdmin) {
      const addSlotMatch = message.match(ADD_SLOT_RE);
      if (addSlotMatch) {
        const reply = await handleAddSlotCommand(addSlotMatch);
        return NextResponse.json({ reply });
      }
    }

    if (/suggest|recommend|best slot|open slot|available slot/i.test(message)) {
      const meetingType = findMentionedMeetingType(message);
      if (meetingType) {
        const reply = await handleSuggestionRequest(meetingType, session.user.email);
        return NextResponse.json({ reply });
      }
    }

    const reply = await azureChat([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI chat failed', err);
    return NextResponse.json(
      { error: 'AI assistant is not available right now.' },
      { status: 503 }
    );
  }
}
