'use client';
import React from 'react';
import AdminCalendar from '@/components/Admin/AdminCalendar';

export default function AdminCalendarPage() {
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Calendar</h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Confirmed meetings across all faculty.</p>
            <AdminCalendar statusFilter="confirmed" />
        </div>
    );
}
