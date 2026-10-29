// Per-meeting-type scheduling rules. Shared between client (for display)
// and server (for authoritative validation).

export type MeetingType = 'DC MEETING' | 'COMPREHENSIVE VIVA' | 'COLLOQUIUM' | 'SYNOPSIS MEETING' | 'ORAL EXAM';

export const MEETING_TYPES: MeetingType[] = [
    'DC MEETING',
    'COMPREHENSIVE VIVA',
    'COLLOQUIUM',
    'SYNOPSIS MEETING',
    'ORAL EXAM',
];

// Meeting types that share one exclusivity "pool": booking one blocks
// conflicting times for every type in the same group, not just its own type.
const GROUPS: Record<string, MeetingType[]> = {
    DC: ['DC MEETING', 'COMPREHENSIVE VIVA'],
    SYNOPSIS: ['SYNOPSIS MEETING', 'ORAL EXAM'],
    COLLOQUIUM: ['COLLOQUIUM'],
};

export function groupFor(type: string): MeetingType[] {
    for (const group of Object.values(GROUPS)) {
        if (group.includes(type as MeetingType)) return group;
    }
    return [type as MeetingType];
}

interface Rule {
    allowedTimes: string[]; // "HH:MM" 24h
    durationMinutes: number;
    gapMinutes: number; // required free gap AFTER a meeting ends before another same-group meeting can start
}

// Visibility block = durationMinutes + gapMinutes: once a slot is booked,
// other slots in the same group are hidden from (start) to (start + block),
// then become visible again. E.g. DC MEETING / COMPREHENSIVE VIVA booked at
// 10:00 (60 + 30 = 90 block) hides 10:30 and 11:00, but shows 11:30/12:00.
// COLLOQUIUM gets the same 1.5 hour (90 min) block via its own gap.
export const MEETING_RULES: Record<MeetingType, Rule> = {
    'DC MEETING': {
        allowedTimes: ['10:00', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00'],
        durationMinutes: 60,
        gapMinutes: 30,
    },
    'COMPREHENSIVE VIVA': {
        allowedTimes: ['10:00', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00'],
        durationMinutes: 60,
        gapMinutes: 30,
    },
    'COLLOQUIUM': {
        allowedTimes: ['11:00', '11:30', '15:00', '15:30'],
        durationMinutes: 30,
        gapMinutes: 60, // 30 + 60 = 90 min (1.5 hour) visibility block
    },
    'SYNOPSIS MEETING': {
        allowedTimes: ['10:00', '11:30', '14:30', '16:00'],
        durationMinutes: 90,
        gapMinutes: 0,
    },
    'ORAL EXAM': {
        allowedTimes: ['10:00', '11:30', '14:30', '16:00'],
        durationMinutes: 90,
        gapMinutes: 0,
    },
};

// Excludes slots dated today whose start time has already passed, so a
// faculty member can't "book" e.g. a 3 PM slot once it's already 7 PM.
export function dropPastSlotsToday<T extends { date: string | Date; start_time: string }>(
  rows: T[],
  now: Date = new Date()
): T[] {
  const todayStr = now.toISOString().split('T')[0];
  const nowTimeStr = now.toTimeString().slice(0, 8); // HH:MM:SS
  return rows.filter((s) => {
    const dateStr = new Date(s.date).toISOString().split('T')[0];
    if (dateStr !== todayStr) return true;
    return s.start_time > nowTimeStr;
  });
}

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Given a candidate start time for `type` and a list of existing active
 * bookings (as {meeting_type, start_time}) on the SAME date, returns true
 * if the candidate conflicts with any of them under the group's duration+gap rule.
 */
export function conflictsWithExisting(
    type: string,
    candidateStart: string,
    existing: { meeting_type: string | null; start_time: string }[]
): boolean {
    const rule = MEETING_RULES[type as MeetingType];
    if (!rule) return false;
    const group = groupFor(type);
    const candidateMin = toMinutes(candidateStart.slice(0, 5));

    for (const b of existing) {
        if (!b.meeting_type || !group.includes(b.meeting_type as MeetingType)) continue;
        const otherRule = MEETING_RULES[b.meeting_type as MeetingType];
        if (!otherRule) continue;
        const otherMin = toMinutes(b.start_time.slice(0, 5));

        const requiredGapAfterOther = otherRule.durationMinutes + otherRule.gapMinutes;
        const requiredGapAfterCandidate = rule.durationMinutes + rule.gapMinutes;

        const conflictsForward = candidateMin >= otherMin && candidateMin < otherMin + requiredGapAfterOther;
        const conflictsBackward = otherMin >= candidateMin && otherMin < candidateMin + requiredGapAfterCandidate;

        if (conflictsForward || conflictsBackward) return true;
    }
    return false;
}

/**
 * A faculty member can't be in two meetings at once, regardless of meeting
 * type — unlike conflictsWithExisting (which only checks within a type's
 * exclusivity group). Given a candidate start time for `type` and the
 * faculty's own existing active bookings (any type, with their real
 * start/end times) on the SAME date, returns true if the candidate's time
 * range overlaps any of them.
 */
export function conflictsWithOwnSchedule(
    type: string,
    candidateStart: string,
    ownBookings: { start_time: string; end_time: string }[]
): boolean {
    const rule = MEETING_RULES[type as MeetingType];
    if (!rule) return false;
    const candidateStartMin = toMinutes(candidateStart.slice(0, 5));
    const candidateEndMin = candidateStartMin + rule.durationMinutes;

    return ownBookings.some((b) => {
        const bStart = toMinutes(b.start_time.slice(0, 5));
        const bEnd = toMinutes(b.end_time.slice(0, 5));
        return candidateStartMin < bEnd && bStart < candidateEndMin;
    });
}
