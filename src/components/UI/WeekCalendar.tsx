'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';
import styles from './WeekCalendar.module.css';

function useIsMobile(breakpoint = 720) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mql.matches);
        update();
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, [breakpoint]);
    return isMobile;
}

export type CalendarEventStatus = 'available' | 'selected' | 'pending' | 'confirmed' | 'cancelled';

export interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    title: string;
    subtitle?: string;
    status: CalendarEventStatus;
}

interface WeekCalendarProps {
    weekStart: Date;
    onNavigate: (direction: -1 | 1) => void;
    onToday: () => void;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    dayCount?: number; // 5 = Mon-Fri, 7 = full week
    startHour?: number;
    endHour?: number;
}

const ROW_HEIGHT = 84; // px per hour — tall enough that a 1hr event card fits time/title/subtitle/badge without clipping

function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
}

interface LaidOutEvent extends CalendarEvent {
    col: number;
    cols: number;
}

// Side-by-side packing for overlapping events in the same day, so slots
// at overlapping/adjacent times (e.g. 11:00 and 11:30, both 1hr) render as
// narrower columns next to each other instead of stacking illegibly on top
// of one another.
function layoutDayEvents(events: CalendarEvent[]): LaidOutEvent[] {
    const sorted = [...events].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    const columnEnds: number[] = []; // end-minute of the last event placed in each column
    const placed: { ev: CalendarEvent; col: number; clusterId: number }[] = [];
    let clusterId = 0;
    let clusterMaxEnd = -1;

    for (const ev of sorted) {
        const startMin = toMinutes(ev.startTime);
        const endMin = Math.max(toMinutes(ev.endTime), startMin + 15);

        if (startMin >= clusterMaxEnd) {
            // No overlap with the running cluster: start a new one.
            clusterId++;
            columnEnds.length = 0;
            clusterMaxEnd = -1;
        }

        let col = columnEnds.findIndex((end) => end <= startMin);
        if (col === -1) {
            col = columnEnds.length;
            columnEnds.push(endMin);
        } else {
            columnEnds[col] = endMin;
        }

        clusterMaxEnd = Math.max(clusterMaxEnd, endMin);
        placed.push({ ev, col, clusterId });
    }

    const colsByCluster = new Map<number, number>();
    for (const p of placed) {
        colsByCluster.set(p.clusterId, Math.max(colsByCluster.get(p.clusterId) ?? 0, p.col + 1));
    }

    return placed.map((p) => ({
        ...p.ev,
        col: p.col,
        cols: colsByCluster.get(p.clusterId) ?? 1,
    }));
}

function fmtDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

function startOfWeek(d: Date): Date {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday as first day
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

const STATUS_LABEL: Record<CalendarEventStatus, string> = {
    available: 'Available',
    selected: 'Selected',
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
};

export default function WeekCalendar({
    weekStart,
    onNavigate,
    onToday,
    events,
    onEventClick,
    dayCount = 5,
    startHour = 9,
    endHour = 17,
}: WeekCalendarProps) {
    const monday = useMemo(() => startOfWeek(weekStart), [weekStart]);
    const today = fmtDate(new Date());
    const isMobile = useIsMobile();

    const days = useMemo(() => {
        const arr: Date[] = [];
        for (let i = 0; i < dayCount; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            arr.push(d);
        }
        return arr;
    }, [monday, dayCount]);

    const hours = useMemo(() => {
        const arr: number[] = [];
        for (let h = startHour; h <= endHour; h++) arr.push(h);
        return arr;
    }, [startHour, endHour]);

    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        for (const e of events) {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        }
        return map;
    }, [events]);

    const rangeStartMin = startHour * 60;
    const totalHeight = (endHour - startHour + 1) * ROW_HEIGHT;

    const todaysCount = events.filter(e => e.date === today).length;

    const rangeLabel = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.nav}>
                    <button className={styles.navBtn} onClick={() => onNavigate(-1)} aria-label="Previous week">
                        <ChevronLeft size={18} />
                    </button>
                    <span className={styles.rangeLabel}>{rangeLabel}</span>
                    <button className={styles.navBtn} onClick={() => onNavigate(1)} aria-label="Next week">
                        <ChevronRight size={18} />
                    </button>
                    <button className={styles.todayBtn} onClick={onToday}>Today</button>
                </div>
                <div className={styles.todayCount}>
                    <strong>{todaysCount}</strong> event{todaysCount === 1 ? '' : 's'} today
                </div>
            </div>

            <div className={styles.legend}>
                {(['available', 'pending', 'confirmed', 'cancelled'] as CalendarEventStatus[]).map(s => (
                    <span key={s} className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles[s]}`} />
                        {STATUS_LABEL[s]}
                    </span>
                ))}
            </div>

            {isMobile ? (
                <div className={styles.agenda}>
                    {days.map(d => {
                        const key = fmtDate(d);
                        const dayEvents = (eventsByDate[key] || []).slice().sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
                        const isToday = key === today;
                        return (
                            <div key={key} className={styles.agendaDay}>
                                <div className={`${styles.agendaDayHeader} ${isToday ? styles.todayHeader : ''}`}>
                                    {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                                {dayEvents.length === 0 ? (
                                    <div className={styles.agendaEmpty}>No slots</div>
                                ) : (
                                    dayEvents.map(ev => {
                                        const clickable = ev.status === 'available' || ev.status === 'selected';
                                        return (
                                            <button
                                                key={ev.id}
                                                className={`${styles.agendaEvent} ${styles[ev.status]} ${clickable ? styles.clickable : ''}`}
                                                disabled={!clickable}
                                                onClick={() => onEventClick?.(ev)}
                                            >
                                                <div className={styles.agendaEventTime}>
                                                    {ev.startTime} - {ev.endTime}
                                                    {ev.status === 'selected' ? <Check size={14} /> : <Clock size={14} />}
                                                </div>
                                                <div className={styles.eventTitle}>{ev.title}</div>
                                                {ev.subtitle && <div className={styles.eventSubtitle}>{ev.subtitle}</div>}
                                                <span className={`${styles.statusBadge} ${styles['badge-' + ev.status]}`}>
                                                    {STATUS_LABEL[ev.status]}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
            <div className={styles.grid} style={{ gridTemplateColumns: `72px repeat(${dayCount}, 1fr)` }}>
                <div className={styles.cornerCell} />
                {days.map(d => {
                    const key = fmtDate(d);
                    const isToday = key === today;
                    return (
                        <div key={key} className={`${styles.dayHeader} ${isToday ? styles.todayHeader : ''}`}>
                            <div className={styles.dayName}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className={styles.dayNum}>{d.getDate()}</div>
                        </div>
                    );
                })}

                <div className={styles.timeColumn} style={{ height: totalHeight }}>
                    {hours.map(h => (
                        <div key={h} className={styles.timeLabel} style={{ height: ROW_HEIGHT }}>
                            {h % 12 === 0 ? 12 : h % 12}:00 {h < 12 ? 'AM' : 'PM'}
                        </div>
                    ))}
                </div>

                {days.map(d => {
                    const key = fmtDate(d);
                    const dayEvents = layoutDayEvents(eventsByDate[key] || []);
                    return (
                        <div key={key} className={styles.dayColumn} style={{ height: totalHeight }}>
                            {hours.map(h => (
                                <div key={h} className={styles.hourCell} style={{ height: ROW_HEIGHT }} />
                            ))}
                            {dayEvents.map(ev => {
                                const startMin = toMinutes(ev.startTime);
                                const endMin = toMinutes(ev.endTime) || startMin + 30;
                                const top = ((startMin - rangeStartMin) / 60) * ROW_HEIGHT;
                                const height = Math.max(((endMin - startMin) / 60) * ROW_HEIGHT, 64);
                                const clickable = ev.status === 'available' || ev.status === 'selected';
                                const widthPct = 100 / ev.cols;
                                const leftPct = ev.col * widthPct;
                                return (
                                    <button
                                        key={ev.id}
                                        className={`${styles.event} ${styles[ev.status]} ${clickable ? styles.clickable : ''}`}
                                        style={{
                                            top,
                                            height,
                                            left: `calc(${leftPct}% + 3px)`,
                                            width: `calc(${widthPct}% - 6px)`,
                                            right: 'auto',
                                        }}
                                        disabled={!clickable}
                                        onClick={() => onEventClick?.(ev)}
                                        title={`${ev.title} ${ev.startTime}-${ev.endTime}`}
                                    >
                                        <div className={styles.eventTop}>
                                            <span className={styles.eventTime}>{ev.startTime}</span>
                                            {ev.status === 'selected' ? <Check size={12} /> : <Clock size={12} />}
                                        </div>
                                        <div className={styles.eventTitle}>{ev.title}</div>
                                        {ev.subtitle && <div className={styles.eventSubtitle}>{ev.subtitle}</div>}
                                        <span className={`${styles.statusBadge} ${styles['badge-' + ev.status]}`}>
                                            {STATUS_LABEL[ev.status]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
            )}
        </div>
    );
}
