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

export const MEETING_RULES: Record<MeetingType, Rule> = {
    'DC MEETING': {
        allowedTimes: ['10:00', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00'],
        durationMinutes: 60,
        gapMinutes: 60,
    },
    'COMPREHENSIVE VIVA': {
        allowedTimes: ['10:00', '11:00', '11:30', '12:00', '15:00', '15:30', '16:00'],
        durationMinutes: 60,
        gapMinutes: 60,
    },
    'COLLOQUIUM': {
        allowedTimes: ['11:00', '11:30', '15:00', '15:30'],
        durationMinutes: 30,
        gapMinutes: 0,
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
