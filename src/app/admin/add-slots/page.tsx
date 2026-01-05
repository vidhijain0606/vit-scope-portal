'use client';
import React, { useState } from 'react';
import styles from './AddSlots.module.css';
import Button from '@/components/UI/Button';
import { supabase } from '@/utils/supabase';

export default function AddSlotsPage() {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!date || !startTime || !endTime) {
            setMessage({ type: 'error', text: 'Please fill all fields' });
            setLoading(false);
            return;
        }

        // Validate date/time is in the future
        const selectedDateTime = new Date(`${date}T${startTime}`);
        const now = new Date();

        if (selectedDateTime < now) {
            setMessage({ type: 'error', text: 'Cannot create slots in the past!' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('slots')
                .insert([
                    { date, start_time: startTime, end_time: endTime, is_available: true }
                ]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Slot created successfully!' });
            // Keep date, maybe clear times?
        } catch (err: any) {
            console.error('Error adding slot:', err);
            const errMsg = err.message || err.details || 'Unknown error';
            setMessage({ type: 'error', text: `Failed to add slot: ${errMsg}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Time Slots</h1>
            <p className={styles.subtitle}>Define available time slots for research facility booking.</p>

            <div className={styles.formCard}>
                {message && (
                    <div className={`${styles.alert} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Date</label>
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]} // Block past dates in UI
                            className={styles.input}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Start Time</label>
                            <input
                                type="time"
                                className={styles.input}
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>End Time</label>
                            <input
                                type="time"
                                className={styles.input}
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button type="submit" variant="primary" isLoading={loading}>
                            Create Slot
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
