import React, { useEffect, useState } from 'react';
import styles from './SlotGrid.module.css';
import { supabase } from '@/utils/supabase';

interface Slot {
    id: string;
    date: string; // Add date
    startTime: string;
    endTime: string;
    duration: string;
    doctor: string;
    status: 'available' | 'booked' | 'disabled';
}

interface SlotGridProps {
    selectedSlotId: string | null;
    onSlotSelect: (id: string, date: string, start: string, end: string) => void;
}

const SlotGrid: React.FC<SlotGridProps> = ({ selectedSlotId, onSlotSelect }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            const todayStr = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('slots')
                .select('*')
                // Filter: Date must be today or in the future
                .gte('date', todayStr)
                .eq('is_available', true)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (data && !error) {
                const mapped: Slot[] = data.map(s => {
                    const start = new Date(`2000-01-01 ${s.start_time}`);
                    const end = new Date(`2000-01-01 ${s.end_time}`);
                    const diffMins = (end.getTime() - start.getTime()) / 60000;
                    const duration = diffMins > 0 ? `${diffMins} Mins` : '1 Hour';

                    return {
                        id: s.id,
                        date: s.date, // Add date to slot object
                        startTime: s.start_time,
                        endTime: s.end_time,
                        duration: duration,
                        doctor: 'Admin Slot',
                        status: s.is_available ? 'available' : 'booked'
                    };
                });
                setSlots(mapped);
            } else {
                setSlots([]);
            }
            setLoading(false);
        };

        fetchSlots();
    }, []);

    // Group slots by date
    const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, Slot[]>);

    return (
        <div className={styles.container}>
            {loading ? <div style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>Loading available slots...</div> :
                Object.keys(groupedSlots).length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No available slots found.</p>
                        <a href="/admin/add-slots" className={styles.createLink}>+ Create New Slots</a>
                    </div>
                ) :
                    Object.entries(groupedSlots).map(([date, dateSlots]) => (
                        <div key={date} className={styles.dateSection}>
                            <h3 className={styles.dateHeader}>
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className={styles.grid}>
                                {dateSlots.map(slot => (
                                    <button
                                        key={slot.id}
                                        className={`
                                  ${styles.slot} 
                                  ${selectedSlotId === slot.id ? styles.selected : ''}
                                `}
                                        onClick={() => onSlotSelect(slot.id, slot.date, slot.startTime, slot.endTime)}
                                    >
                                        <div className={styles.topRow}>
                                            <span className={styles.time}>{slot.startTime}</span>
                                            {selectedSlotId === slot.id ? (
                                                <span className={styles.checkIcon}>✓</span>
                                            ) : (
                                                <span className={styles.clockIcon}>🕒</span>
                                            )}
                                        </div>
                                        <div className={styles.bottomRow}>
                                            <span className={styles.duration}>{slot.duration}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
        </div>
    );
};

export default SlotGrid;
