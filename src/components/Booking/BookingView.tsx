'use client';
import React, { useEffect, useState } from 'react';
import styles from './BookingView.module.css';
import SlotGrid from './SlotGrid';
import BookingSidebar from './BookingSidebar';
import SuccessModal from '../UI/SuccessModal';
import AlertModal from '../UI/AlertModal';
import { MEETING_TYPES } from '@/utils/meetingRules';

export default function BookingView() {
    const [meetingType, setMeetingType] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [alertData, setAlertData] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info',
    });

    const [oralExamEnabled, setOralExamEnabled] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setOralExamEnabled(!!data.oralExamEnabled);
            }
        };
        fetchSettings();
    }, []);

    const stepIndex = !meetingType ? 0 : !selectedSlotId ? 1 : 2;
    const STEPS = ['Select Meeting Type', 'Pick a Slot', 'Enter Details & Confirm'];

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
                setAlertData({
                    isOpen: true,
                    title: 'No suggestion available',
                    message: data.reason || data.error || 'No suggestion available right now.',
                    type: 'info',
                });
            }
        } catch {
            setAlertData({
                isOpen: true,
                title: 'AI assistant unavailable',
                message: 'Could not get an AI suggestion right now. Please try again shortly.',
                type: 'error',
            });
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
            setAlertData({
                isOpen: true,
                title: 'Could not book this slot',
                message: err instanceof Error ? err.message : 'Something went wrong — please try again.',
                type: 'error',
            });
        }
    };

    return (
        <div className={styles.container}>
            <AlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData(prev => ({ ...prev, isOpen: false }))}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 700,
                                background: i <= stepIndex ? '#2563eb' : '#e5e7eb',
                                color: i <= stepIndex ? '#fff' : '#6b7280',
                            }}>
                                {i + 1}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: i === stepIndex ? 700 : 500, color: i <= stepIndex ? '#111827' : '#9ca3af' }}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{ width: 24, height: 2, background: i < stepIndex ? '#2563eb' : '#e5e7eb' }} />
                        )}
                    </React.Fragment>
                ))}
            </div>

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
                        {MEETING_TYPES.map(t => {
                            const disabled = t === 'ORAL EXAM' && !oralExamEnabled;
                            return (
                                <option key={t} value={t} disabled={disabled}>
                                    {t}{disabled ? ' (Currently Disabled)' : ''}
                                </option>
                            );
                        })}
                    </select>
                    {!oralExamEnabled && (
                        <p style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '0.4rem' }}>
                            Oral Exam bookings are currently paused by the admin.
                        </p>
                    )}
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
