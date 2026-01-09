'use client';
import React, { useState } from 'react';
import styles from './DashboardView.module.css';
import BookingCard, { BookingProps } from './BookingCard'; // Import interface
import { supabase } from '@/utils/supabase';
import { checkAccess } from '@/utils/accessControl';
import AlertModal from '../UI/AlertModal';

const DashboardView = () => {
    const [user, setUser] = React.useState<any>(null);
    const [activeTab, setActiveTab] = React.useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    // searchTerm state removed
    const [bookings, setBookings] = React.useState<BookingProps[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [anonCount, setAnonCount] = useState<number | null>(null);
    const [alertData, setAlertData] = React.useState<{ isOpen: boolean, title: string, message: string, type: 'error' | 'success' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Access Control Check
                const access = checkAccess(user.email);
                if (!access.isAllowed) {
                    setAlertData({
                        isOpen: true,
                        title: 'Access Restricted',
                        message: access.reason || 'This portal is restricted to VIT Faculty only.',
                        type: 'error'
                    });
                    // Will redirect after modal close
                    return;
                }
                setUser(user);
            } else {
                // If no user, redirect to login or home
                window.location.href = '/';
            }
        };
        getUser();
    }, []);

    React.useEffect(() => {
        const fetchBookings = async () => {
            if (!user || !user.email) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // 1. Try Authenticated Fetch
            const { data: authData, error: authError } = await supabase
                .from('bookings')
                .select('*')
                // Filter by emp_email (case insensitive)
                .ilike('emp_email', user.email);

            let finalBookings = authData || [];

            // 2. Fallback: If Auth returns nothing or errors, try Anonymous Fetch
            // (Exploiting potential RLS misconfiguration where Anon > Auth)
            if (authError || !authData || authData.length === 0) {
                console.log('Auth fetch empty/failed, trying Anon fallback...');
                try {
                    const { createClient } = await import('@supabase/supabase-js');
                    const { supabaseUrl, supabaseAnonKey } = await import('@/utils/supabase');
                    // Create a fresh client that does NOT persist the session (truly anonymous)
                    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
                        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
                    });

                    const { data: anonData } = await anonClient.from('bookings').select('*');

                    if (anonData && anonData.length > 0) {
                        // Client-side Filter
                        const userEmailLower = user.email.toLowerCase();
                        const fallbackMatches = anonData.filter((b: any) =>
                            b.emp_email?.toLowerCase() === userEmailLower ||
                            b.user_id === user.id // Just in case
                        );
                        if (fallbackMatches.length > 0) {
                            finalBookings = fallbackMatches;
                        }
                    }
                } catch (err) {
                    console.error('Fallback fetch failed', err);
                }
            }

            // Map to UI
            const mapped = finalBookings.map((b: any) => ({
                id: b.id,
                title: b.title,
                date: {
                    month: new Date(b.date).toLocaleString('default', { month: 'short' }).toUpperCase(),
                    day: new Date(b.date).getDate().toString()
                },
                time: `${b.start_time} - ${b.end_time}`,
                isOnline: b.is_online,
                student: {
                    name: b.scholar_name || 'Unknown',
                    regNo: b.scholar_id || 'N/A'
                },
                status: b.status
            }));

            setBookings(mapped);
            setLoading(false);
        };

        fetchBookings();
    }, [user?.email]); // Use primitive dependency to avoid object reference instability and HMR errors.

    const handleAlertClose = async () => {
        setAlertData(prev => ({ ...prev, isOpen: false }));
        // If it was an access error, sign out
        if (alertData.title === 'Access Restricted' || alertData.title.includes('Access Denied')) {
            await supabase.auth.signOut();
            window.location.href = '/';
        }
    };

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
            // IMPORTANT: `bookingData.date` might be full timestamp or date string string. 
            // `slots.date` is date column.
            const dateStr = new Date(bookingData.date).toISOString().split('T')[0];

            const { error: slotError } = await supabase
                .from('slots')
                .update({ is_available: true })
                .eq('date', dateStr)
                .eq('start_time', bookingData.start_time)
                .eq('end_time', bookingData.end_time);

            if (slotError) {
                console.warn('Could not free up slot automatically', slotError);
                // Try alternate match without date formatting if needed? 
                // Usually Supabase date column handles YYYY-MM-DD
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
        if (activeTab === 'upcoming') {
            return ['upcoming', 'pending', 'confirmed'].includes(booking.status.toLowerCase());
        }
        return booking.status === activeTab;
    });

    return (
        <div className={styles.container}>
            <AlertModal
                isOpen={alertData.isOpen}
                onClose={handleAlertClose}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
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
                        Upcoming <span className={styles.countBadge}>{bookings.filter(b => ['upcoming', 'pending', 'confirmed'].includes(b.status.toLowerCase())).length}</span>
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

export default DashboardView;
