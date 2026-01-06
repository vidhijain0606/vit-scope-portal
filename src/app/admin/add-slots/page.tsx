'use client';
import React from 'react';
import styles from './AddSlots.module.css';

export default function AddSlotsPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Add Time Slots</h1>
            <p className={styles.subtitle}>Define available time slots for research facility booking.</p>

            <div className={styles.formCard}>
                <div className={styles.alert} style={{ backgroundColor: '#e7f1ff', color: '#004085', border: '1px solid #b8daff' }}>
                    <strong>System Notice:</strong> Slot creation is currently automated. Fixed slots (Mon-Fri, 10am-1pm & 3pm-5pm) are generated automatically by the system. Manual creation is disabled.
                </div>
            </div>
        </div>
    );
}
