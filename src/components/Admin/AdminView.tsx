import { supabase } from '@/utils/supabase';
import React, { useEffect, useState } from 'react';
import styles from './AdminView.module.css';
import StatCard from './StatCard';
import AdminTable from './AdminTable';

export default function AdminView() {
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedSlots: 0,
        cancelledSlots: 0,
        totalUsers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            // Fetch bookings counts
            const { data: bookings } = await supabase.from('bookings').select('status');
            const total = bookings?.length || 0;
            const confirmed = bookings?.filter(b => b.status === 'upcoming' || b.status === 'confirmed').length || 0;
            const cancelled = bookings?.filter(b => b.status === 'cancelled').length || 0;

            // Fetch users count (handling case where table doesn't exist yet)
            let userCount = 0;
            try {
                const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
                if (!error) {
                    userCount = count || 0;
                } else {
                    console.warn('Could not fetch user stats (table might be missing):', error.message);
                }
            } catch (err) {
                console.warn('Failed to fetch user stats via Supabase.');
            }

            setStats({
                totalBookings: total,
                confirmedSlots: confirmed,
                cancelledSlots: cancelled,
                totalUsers: userCount
            });
        };

        fetchStats();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.statsGrid}>
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    trend="All time"
                    icon="📅"
                    color="#e7f1ff"
                />
                <StatCard
                    title="Active Bookings"
                    value={stats.confirmedSlots}
                    trend="Upcoming & Confirmed"
                    icon="✅"
                    color="#d1e7dd"
                />
                <StatCard
                    title="Cancelled"
                    value={stats.cancelledSlots}
                    trend="Cancelled appointments"
                    icon="🚫"
                    color="#fff3cd"
                />
                <StatCard
                    title="Total Faculty"
                    value={stats.totalUsers}
                    trend="Registered users"
                    icon="🎓"
                    color="#f3e5f5"
                />
            </div>

            <AdminTable />
        </div>
    );
}
