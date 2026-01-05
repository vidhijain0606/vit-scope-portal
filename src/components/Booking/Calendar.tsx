'use client';
import React, { useState } from 'react';
import styles from './Calendar.module.css';

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
    // Mocking October 2023 for the demo to match screenshot
    const monthName = "October 2023";
    const days = [
        // S, M, T, W, T, F, S
        null, null, null, null, null, null, null, // padding
        1, 2, 3, 4, 5, 6, 7, // week 1 (starts sunday) note: Oct 1 2023 was Sunday actually. Let's align to screenshot
        // Screenshot: 1 is on Sunday. 4 is selected (Wednesday).
        8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21,
        22, 23, 24, 25, 26, 27, 28,
        29, 30, 31
    ];

    // The screenshot shows "Monday, October 9th" as the selected view, but date '4' is highlighted blue?
    // Or maybe '9' is highlighted. It's blue in the grid logic.
    // Wait, in the screenshot '4' is blue. And '9' is blue circle. 
    // Let's assume the user selects a date.

    // Actually Oct 2023:
    // 1st is Sunday.

    const isSelected = (day: number | null) => {
        if (!day || !selectedDate) return false;
        return day === selectedDate.getDate();
    };

    return (
        <div className={styles.calendar}>
            <div className={styles.header}>
                <span className={styles.monthTitle}>{monthName}</span>
                <div className={styles.nav}>
                    <button className={styles.navBtn}>‹</button>
                    <button className={styles.navBtn}>›</button>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.dayLabel}>S</div>
                <div className={styles.dayLabel}>M</div>
                <div className={styles.dayLabel}>T</div>
                <div className={styles.dayLabel}>W</div>
                <div className={styles.dayLabel}>T</div>
                <div className={styles.dayLabel}>F</div>
                <div className={styles.dayLabel}>S</div>

                {days.map((day, idx) => (
                    <div key={idx} className={styles.dayCell}>
                        {day && (
                            <button
                                className={`${styles.dayBtn} ${isSelected(day) ? styles.selected : ''}`}
                                onClick={() => {
                                    const newDate = new Date(2023, 9, day); // Month is 0-indexed (9 = Oct)
                                    onDateSelect(newDate);
                                }}
                            >
                                {day}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
