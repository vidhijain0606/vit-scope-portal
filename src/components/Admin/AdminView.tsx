import React, { useEffect, useState } from 'react';
import { CalendarRange, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import styles from './AdminView.module.css';
import StatCard from './StatCard';
import AdminTable from './AdminTable';
import OralExamToggle from './OralExamToggle';

export default function AdminView() {
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedSlots: 0,
        cancelledSlots: 0,
        totalUsers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                setStats(await res.json());
            }
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
                    icon={<CalendarRange size={24} color="#0d6efd" />}
                    color="#e7f1ff"
                />
                <StatCard
                    title="Active Bookings"
                    value={stats.confirmedSlots}
                    trend="Upcoming & Confirmed"
                    icon={<CheckCircle size={24} color="#198754" />}
                    color="#d1e7dd"
                />
                <StatCard
                    title="Cancelled"
                    value={stats.cancelledSlots}
                    trend="Cancelled appointments"
                    icon={<XCircle size={24} color="#dc3545" />}
                    color="#fff3cd"
                />
                <StatCard
                    title="Total Faculty"
                    value={stats.totalUsers}
                    trend="Registered users"
                    icon={<GraduationCap size={24} color="#6f42c1" />}
                    color="#f3e5f5"
                />
            </div>

            <OralExamToggle />

            <AdminTable />
        </div>
    );
}
