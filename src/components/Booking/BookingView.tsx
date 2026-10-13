'use client';
import React, { useState } from 'react';
import styles from './BookingView.module.css';
import SlotGrid from './SlotGrid';
import BookingSidebar from './BookingSidebar';
import SuccessModal from '../UI/SuccessModal';
import { MEETING_TYPES } from '@/utils/meetingRules';

export default function BookingView() {
    const [meetingType, setMeetingType] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [suggesting, setSuggesting] = useState(false);

    const handleSuggestSlot = async () => {
        if (!meetingType) return;
        setSuggesting(true);
        try {
            const res = await fetch('/api/ai/suggest-slot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingType }),
            });
            const data = await res.json();
            if (res.ok && data.suggestion) {
                handleSlotSelect(data.suggestion.id, data.suggestion.date, data.suggestion.start_time, data.suggestion.end_time);
            } else {
                alert(data.reason || data.error || 'No suggestion available right now.');
            }
        } catch {
            alert('Could not get an AI suggestion right now.');
        } finally {
            setSuggesting(false);
        }
    };

    const handleMeetingTypeChange = (type: string) => {
        setMeetingType(type);
        setSelectedSlotId(null);
        setSelectedDate(null);
        setSelectedTime(null);
    };

    const handleSlotSelect = (id: string, dateStr: string, start: string, end: string) => {
        setSelectedSlotId(id);
        setSelectedDate(new Date(dateStr));
        setSelectedTime(`${start} - ${end}`);
    };

    const handleConfirmBooking = async (details: { empId: string; empName: string; scholarId: string; scholarName: string; email: string }) => {
        if (!selectedSlotId || !meetingType) return;

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slotId: selectedSlotId,
                    empId: details.empId,
                    empName: details.empName,
                    scholarId: details.scholarId,
                    scholarName: details.scholarName,
                    meetingType,
                }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || 'Failed to book slot.');
            }

            setShowSuccessModal(true);
        } catch (err) {
            console.error('Booking failed', err);
            alert(`Failed to book slot: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    return (
        <div className={styles.container}>
            {showSuccessModal && (
                <SuccessModal
                    onClose={() => window.location.href = '/dashboard'}
                    onVtop={() => {
                        window.open('https://vtop.vit.ac.in', '_blank');
                        window.location.href = '/dashboard';
                    }}
                />
            )}
            <h1 className={styles.pageTitle}>Book a Slot</h1>
            <p className={styles.pageSubtitle}>Choose a meeting type, then select an available time slot.</p>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Type of Meeting
                    </label>
                    <select
                        value={meetingType}
                        onChange={(e) => handleMeetingTypeChange(e.target.value)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.95rem',
                            minWidth: '260px',
                        }}
                    >
                        <option value="" disabled>-- Select Meeting Type --</option>
                        {MEETING_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {meetingType && (
                    <button
                        onClick={handleSuggestSlot}
                        disabled={suggesting}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #2563eb',
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: suggesting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {suggesting ? 'Thinking...' : '✨ Suggest best slot'}
                    </button>
                )}
            </div>

            {!meetingType ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    Select a meeting type above to see available slots.
                </div>
            ) : (
                <div className={styles.layout}>
                    <div className={styles.gridCol}>
                        <SlotGrid
                            meetingType={meetingType}
                            selectedSlotId={selectedSlotId}
                            onSlotSelect={handleSlotSelect}
                        />
                    </div>

                    <div className={styles.sidebarCol}>
                        <BookingSidebar
                            meetingType={meetingType}
                            selectedDate={selectedDate}
                            selectedSlotId={selectedSlotId}
                            selectedTime={selectedTime}
                            onConfirm={handleConfirmBooking}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
