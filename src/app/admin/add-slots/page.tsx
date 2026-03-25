"use client";

import React, { useState } from 'react';
import styles from './AddSlots.module.css';
import AdminSlotForm from '@/components/Admin/AdminSlotForm';
import AdminSlotList from '@/components/Admin/AdminSlotList';

export default function AddSlotsPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleSlotCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Time Slots</h1>
            <p className={styles.subtitle}>Define available time slots for research facility booking.</p>

            <div className={styles.formCard}>
                <AdminSlotForm onSlotCreated={handleSlotCreated} />
            </div>

            <AdminSlotList refreshTrigger={refreshTrigger} />
        </div>
    );
}
