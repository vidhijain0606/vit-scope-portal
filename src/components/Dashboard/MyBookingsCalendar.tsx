'use client';
import React, { useEffect, useState } from 'react';
import WeekCalendar, { CalendarEvent, CalendarEventStatus } from '../UI/WeekCalendar';

interface RawBooking {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string | null;
    meeting_type: string | null;
    scholar_name: string | null;
    status: string | null;
}

function statusFor(raw: string | null): CalendarEventStatus {
    const s = (raw || 'pending').toLowerCase();
    if (s === 'cancelled') return 'cancelled';
    if (s === 'confirmed') return 'confirmed';
    return 'pending';
}

export default function MyBookingsCalendar() {
    const [bookings, setBookings] = useState<RawBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const res = await fetch('/api/bookings');
            const data = res.ok ? await res.json() : [];
            setBookings(data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const events: CalendarEvent[] = bookings.map(b => ({
        id: b.id,
        date: new Date(b.date).toISOString().split('T')[0],
        startTime: (b.start_time || '').slice(0, 5),
        endTime: (b.end_time || '').slice(0, 5),
        title: b.meeting_type || b.title || 'Meeting',
        subtitle: b.scholar_name ? `Scholar: ${b.scholar_name}` : undefined,
        status: statusFor(b.status),
    }));

    return (
        <div>
            {loading && <div style={{ padding: '1rem', color: '#6b7280' }}>Loading your booked slots...</div>}
            <WeekCalendar
                weekStart={weekStart}
                onNavigate={(dir) => setWeekStart(prev => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() + dir * 7);
                    return d;
                })}
                onToday={() => setWeekStart(new Date())}
                events={events}
            />
        </div>
    );
}
