'use client';
import React, { useState } from 'react';
import styles from './AdminSlotForm.module.css';
import { supabase } from '@/utils/supabase';

interface AdminSlotFormProps {
    onSlotCreated?: () => void;
}

export default function AdminSlotForm({ onSlotCreated }: AdminSlotFormProps) {
    const [date, setDate] = useState('');
    const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Manual Range State
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState(30); // Default 30 mins
    // Defined presets
    const timePresets = [
        "10:00", "11:00", "11:30", "12:00",
        "14:30", // 2:30 PM
        "15:00", "15:30", "16:00",
        "16:30" // Extra if needed, but sticking to requested list roughly
    ];

    // Helper to calculate end time (assuming 1 hour duration by default for simplicity, 
    // or we can just set start times. 
    // The previous logic used specific end times.
    // 10:00 -> 11:00
    // 11:30 -> 12:30? 
    // Let's assume 1 hour slots for standard.
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
                is_available: true
            }));

            const { error } = await supabase.from('slots').insert(slotsToInsert);

            if (error) throw error;

            alert('Slots created successfully!');
            if (onSlotCreated) onSlotCreated(); // Trigger refresh
            setSelectedTimes([]);
            // Optional: reset date? Keep it for bulk creation convenience.
        } catch (err: any) {
            console.error(err);
            alert('Error creating slots: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Select Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Select Time Slots</label>
                    <div className={styles.slotGrid}>
                        {timePresets.map(time => (
                            <div
                                key={time}
                                className={`${styles.slotCheckbox} ${selectedTimes.includes(time) ? styles.selected : ''}`}
                                onClick={() => toggleTime(time)}
                            >
                                {time}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || !date || selectedTimes.length === 0}
                >
                    {loading ? 'Creating...' : `Create ${selectedTimes.length} Slots`}
                </button>
            </form>
        </div>
    );
}
