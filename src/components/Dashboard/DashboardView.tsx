'use client';
import React, { useState } from 'react';
import styles from './DashboardView.module.css';
import BookingCard from './BookingCard';
import { supabase } from '@/utils/supabase';

export default function DashboardView() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    // searchTerm state removed
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchBookings = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user || !user.email) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                // IMPORTANT: Filter by the email saved during booking (emp_email)
                .eq('emp_email', user.email);

            if (error) {
                console.error('Error fetching bookings:', error);
            } else {
                const mapped = (data || []).map(b => ({
                    id: b.id,
                    title: b.title,
                    date: {
                        month: new Date(b.date).toLocaleString('default', { month: 'short' }).toUpperCase(),
                        day: new Date(b.date).getDate().toString()
                    },
                    time: `${b.start_time} - ${b.end_time}`,
                    location: b.location,
                    isOnline: b.is_online,
                    student: {
                        name: b.scholar_name || 'Unknown',
                        regNo: b.scholar_id || 'N/A'
                    },
                    status: b.status
                }));
                setBookings(mapped);
            }
            setLoading(false);
        };

        fetchBookings();
    }, []);

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            // 1. Get the booking details first to find the slot
            const { data: bookingData, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', bookingId)
                .single();

            if (fetchError || !bookingData) throw new Error('Booking not found');

            // 2. Update booking status to cancelled
            const { error: updateBookingError } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

            if (updateBookingError) throw updateBookingError;

            // 3. Make the slot available again
            // matching by date, start_time, end_time since we don't have slot_id linkage
            const { error: slotError } = await supabase
                .from('slots')
                .update({ is_available: true })
                .eq('date', bookingData.date)
                .eq('start_time', bookingData.start_time)
                .eq('end_time', bookingData.end_time);

            if (slotError) {
                console.warn('Could not free up slot automatically', slotError);
            }

            // 4. Update UI locally
            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
            ));

            alert('Booking cancelled successfully.');

        } catch (err: any) {
            console.error('Failed to cancel', err);
            alert('Failed to cancel booking.');
        }
    };

    const filteredBookings = bookings.filter(booking => {
        return booking.status === activeTab;
    });

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>My Booked Slots</h1>
                <p className={styles.pageSubtitle}>Manage your upcoming and past research appointments.</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming <span className={styles.countBadge}>{bookings.filter(b => b.status === 'upcoming').length}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'completed' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        Cancelled
                    </button>
                </div>
                {/* Search box removed */}
            </div>

            <div className={styles.bookingList}>
                {loading ? (
                    <div className={styles.emptyState}>Loading bookings...</div>
                ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking: any) => (
                        <BookingCard key={booking.id} {...booking} onCancel={handleCancel} />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        No {activeTab} bookings found.
                    </div>
                )}
            </div>
        </div>
    );
}
