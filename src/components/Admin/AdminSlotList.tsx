import React, { useEffect, useState } from 'react';
import { Trash2, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface Slot {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

interface AdminSlotListProps {
    refreshTrigger: number;
}

const AdminSlotList: React.FC<AdminSlotListProps> = ({ refreshTrigger }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSlots = async () => {
        setLoading(true);
        const todayStr = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('slots')
            .select('*')
            .gte('date', todayStr) // Only future/today slots
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (data && !error) {
            setSlots(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSlots();
    }, [refreshTrigger]);

    const handleDelete = async (id: string, isAvailable: boolean) => {
        let confirmMessage = 'Are you sure you want to delete this slot?';

        if (!isAvailable) {
            confirmMessage = '⚠️ WARNING: This slot is currently BOOKED/CONFIRMED.\n\nDeleting it will remove the slot time from the system, but the Booking Record will remain in the database (as "Cancelled" or orphan).\n\nAre you sure you want to FORCE DELETE this slot?';
        }

        if (!confirm(confirmMessage)) return;

        // If it's booked, we should ideally find the booking and cancel it too, 
        // but for now let's just delete the slot as requested to "get rid of it".
        const { error } = await supabase.from('slots').delete().eq('id', id);

        if (error) {
            console.error('Error deleting slot:', error);
            alert('Failed to delete slot.');
        } else {
            setSlots(prev => prev.filter(s => s.id !== id));
        }
    };

    // Group by Date
    const groupedSlots = slots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
    }, {} as Record<string, Slot[]>);

    return (
        <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                Existing Time Slots
            </h2>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading slots...</div>
            ) : Object.keys(groupedSlots).length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    No future slots found. Add some above!
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                        <div key={date} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{
                                background: '#f3f4f6',
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid #e5e7eb',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Calendar size={18} className="text-gray-500" />
                                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#6b7280' }}>
                                    {dateSlots.length} slots
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1px', background: '#e5e7eb' }}>
                                {dateSlots.map(slot => (
                                    <div key={slot.id} style={{
                                        background: 'white',
                                        padding: '0.75rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        opacity: slot.is_available ? 1 : 0.6
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: '#374151' }}>
                                                <Clock size={14} />
                                                {slot.start_time.slice(0, 5)}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(slot.id, slot.is_available)}
                                                style={{
                                                    color: '#ef4444',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                                title="Delete Slot"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.75rem' }}>
                                            {slot.is_available ? (
                                                <span style={{ color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Available</span>
                                            ) : (
                                                <span style={{ color: '#f59e0b', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px' }}>Booked</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSlotList;
