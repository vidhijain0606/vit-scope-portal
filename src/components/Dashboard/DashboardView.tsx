'use client';
import React, { useState } from 'react';
import styles from './DashboardView.module.css';
import BookingCard, { BookingCardProps } from './BookingCard'; // Import interface
import { useSession, signOut } from 'next-auth/react';
import { checkAccess } from '@/utils/accessControl';
import AlertModal from '../UI/AlertModal';

interface BookingRow {
    id: string;
    slot_id: string;
    title: string;
    meeting_type: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    scholar_name: string | null;
    scholar_id: string | null;
}

const DashboardView = () => {
    const { data: session } = useSession();
    const user = session?.user ?? null;
    const [activeTab, setActiveTab] = React.useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    // searchTerm state removed
    const [bookings, setBookings] = React.useState<BookingCardProps[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [anonCount, setAnonCount] = useState<number | null>(null);
    const [alertData, setAlertData] = React.useState<{ isOpen: boolean, title: string, message: string, type: 'error' | 'success' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info'
    });

    React.useEffect(() => {
        if (session === null) {
            // No session resolved yet, or signed out — redirect.
            return;
        }
        if (user?.email) {
            const access = checkAccess(user.email);
            if (!access.isAllowed) {
                setAlertData({
                    isOpen: true,
                    title: 'Access Restricted',
                    message: access.reason || 'This portal is restricted to VIT Faculty only.',
                    type: 'error'
                });
            }
        }
    }, [session, user?.email]);

    const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');

    // ... (keep existing getUser effect)

    React.useEffect(() => {
        const fetchBookings = async () => {
            if (!user?.email) {
                setLoading(false);
                return;
            }

            setLoading(true);

            const res = await fetch('/api/bookings');
            const finalBookings: BookingRow[] = res.ok ? await res.json() : [];

            // Map to UI
            const mapped = finalBookings.map((b) => ({
                id: b.id,
                title: b.title,
                meeting_type: b.meeting_type || b.title, // Ensure we have a filterable field
                date: {
                    month: new Date(b.date).toLocaleString('default', { month: 'short' }).toUpperCase(),
                    day: new Date(b.date).getDate().toString()
                },
                dateStr: b.date, // Store purely for sorting if needed (already sorted by DB)
                time: `${b.start_time} - ${b.end_time}`,
                student: {
                    name: b.scholar_name || 'Unknown',
                    regNo: b.scholar_id || 'N/A'
                },
                status: (b.status || 'pending') as BookingCardProps['status']
            }));

            setBookings(mapped);
            setLoading(false);
        };

        fetchBookings();
    }, [user?.email]);

    const handleAlertClose = async () => {
        setAlertData(prev => ({ ...prev, isOpen: false }));
        // If it was an access error, sign out
        if (alertData.title === 'Access Restricted' || alertData.title.includes('Access Denied')) {
            await signOut({ callbackUrl: '/' });
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, action: 'cancel' }),
            });

            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error || 'Failed to cancel booking');
            }

            setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: 'cancelled' } : b
            ));

            alert('Booking cancelled successfully.');
        } catch (err) {
            console.error('Failed to cancel', err);
            alert('Failed to cancel booking.');
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const filteredBookings = bookings.filter(booking => {
        // Helper to check if date is past
        // booking.dateStr is YYYY-MM-DD
        const isPast = (booking.dateStr || '') < todayStr;
        const isCancelled = booking.status === 'cancelled';

        // 1. Tab Filter
        if (activeTab === 'upcoming') {
            // Future dates AND not cancelled
            // Also include today
            if (isCancelled) return false;
            return !isPast; // Date >= Today
        }
        else if (activeTab === 'completed') {
            // Past dates OR explicitly completed status
            if (isCancelled) return false;
            return isPast || booking.status === 'completed';
        }
        else if (activeTab === 'cancelled') {
            return isCancelled;
        }

        // 2. Meeting Type Filter
        if (meetingTypeFilter !== 'All' && booking.title !== meetingTypeFilter) return false;

        // 3. Status Filter (specific)
        if (statusFilter !== 'All' && booking.status !== statusFilter) return false;

        return true;
    });

    // Helper for counts
    const getTabCount = (tab: string) => {
        return bookings.filter(b => {
            const isPast = (b.dateStr || '') < todayStr;
            const isCancelled = b.status === 'cancelled';
            if (tab === 'upcoming') return !isPast && !isCancelled;
            if (tab === 'completed') return (isPast || b.status === 'completed') && !isCancelled;
            if (tab === 'cancelled') return isCancelled;
            return false;
        }).length;
    };

    // Unique Meeting Types for Dropdown
    const meetingTypes = ['All', ...Array.from(new Set(bookings.map(b => b.title)))];
    // Statuses for Dropdown (dependent on Tab? maybe just generic)
    const statuses = ['All', 'upcoming', 'pending', 'confirmed', 'cancelled', 'completed'];

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
                        Upcoming <span className={styles.countBadge}>{getTabCount('upcoming')}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'completed' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed <span className={styles.countBadge}>{getTabCount('completed')}</span>
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'cancelled' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        Cancelled <span className={styles.countBadge}>{getTabCount('cancelled')}</span>
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        value={meetingTypeFilter}
                        onChange={(e) => setMeetingTypeFilter(e.target.value)}
                    >
                        <option value="All">All Meeting Types</option>
                        {meetingTypes.filter(t => t !== 'All').map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="upcoming">Upcoming</option>
                    </select>
                </div>
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
                        No {activeTab} bookings found matching filters.
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardView;
