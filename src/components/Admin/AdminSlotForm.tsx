'use client';
import React, { useState } from 'react';
import { Check, Clock, Loader2 } from 'lucide-react';
import styles from './AdminSlotForm.module.css';
import AlertModal from '../UI/AlertModal';
import MonthDatePicker from '../UI/MonthDatePicker';

interface AdminSlotFormProps {
    onSlotCreated?: () => void;
}

function formatTime12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDateReadable(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AdminSlotForm({ onSlotCreated }: AdminSlotFormProps) {
    const [date, setDate] = useState('');
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [alertData, setAlertData] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info',
    });

    const timePresets = [
        "10:00", "11:00", "11:30", "12:00",
        "14:30",
        "15:00", "15:30", "16:00",
        "16:30",
    ];

    const getEndTime = (start: string) => {
        const [h, m] = start.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0);
        d.setHours(d.getHours() + 1);
        return d.toTimeString().slice(0, 5);
    };

    const toggleTime = (time: string) => {
        setSelectedTimes(prev =>
            prev.includes(time)
                ? prev.filter(t => t !== time)
                : [...prev, time]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || selectedTimes.length === 0) return;

        setLoading(true);
        try {
            const slotsToInsert = selectedTimes.map(time => ({
                date: date,
                start_time: time,
                end_time: getEndTime(time),
            }));

            const res = await fetch('/api/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slots: slotsToInsert }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || 'Failed to create slots');
            }

            const { inserted, skipped } = await res.json();
            const skippedTimes: string[] = skipped.map((s: string) => {
                const time = s.split(' ')[1];
                return time ? formatTime12h(time) : s;
            });

            if (inserted.length === 0 && skipped.length > 0) {
                setAlertData({
                    isOpen: true,
                    title: 'Those slots already exist',
                    message: `All ${skipped.length} selected time${skipped.length === 1 ? '' : 's'} on ${formatDateReadable(date)} ${skipped.length === 1 ? 'is' : 'are'} already on the calendar (${skippedTimes.join(', ')}). Pick a different date or time to add something new.`,
                    type: 'info',
                });
            } else if (skipped.length > 0) {
                setAlertData({
                    isOpen: true,
                    title: 'Slots created, with a few skipped',
                    message: `Added ${inserted.length} new slot${inserted.length === 1 ? '' : 's'} on ${formatDateReadable(date)}. ${skipped.length} ${skipped.length === 1 ? 'was' : 'were'} skipped because ${skipped.length === 1 ? 'it already exists' : 'they already exist'}: ${skippedTimes.join(', ')}.`,
                    type: 'success',
                });
            } else {
                setAlertData({
                    isOpen: true,
                    title: 'Slots created',
                    message: `${inserted.length} slot${inserted.length === 1 ? '' : 's'} added for ${formatDateReadable(date)}.`,
                    type: 'success',
                });
            }

            if (onSlotCreated) onSlotCreated();
            setSelectedTimes([]);
        } catch (err) {
            console.error(err);
            setAlertData({
                isOpen: true,
                title: 'Couldn\'t create slots',
                message: err instanceof Error ? err.message : 'Something went wrong — please try again.',
                type: 'error',
            });
        } finally {
            setLoading(false);
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

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Select Date</label>
                    <MonthDatePicker
                        value={date}
                        onChange={setDate}
                        minDate={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Select Time Slots</label>
                    <div className={styles.slotGrid}>
                        {timePresets.map(time => {
                            const isSelected = selectedTimes.includes(time);
                            return (
                                <button
                                    type="button"
                                    key={time}
                                    className={`${styles.slotCheckbox} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => toggleTime(time)}
                                >
                                    {isSelected ? <Check size={15} /> : <Clock size={15} />}
                                    {formatTime12h(time)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || !date || selectedTimes.length === 0}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className={styles.spin} /> Creating...
                        </>
                    ) : (
                        `Create ${selectedTimes.length || ''} Slot${selectedTimes.length === 1 ? '' : 's'}`
                    )}
                </button>
            </form>
        </div>
    );
}
