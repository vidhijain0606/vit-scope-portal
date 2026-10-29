'use client';
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MonthDatePicker.module.css';

interface MonthDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    minDate?: string; // YYYY-MM-DD
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(d: Date): string {
    return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function nextWeekday(d: Date, weekday: number): Date {
    const copy = new Date(d);
    const diff = (weekday - copy.getDay() + 7) % 7 || 7;
    copy.setDate(copy.getDate() + diff);
    return copy;
}

export default function MonthDatePicker({ value, onChange, minDate }: MonthDatePickerProps) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
    const [viewMonth, setViewMonth] = useState(() => selectedDate ?? today);

    const min = minDate ? new Date(`${minDate}T00:00:00`) : today;

    const quickRanges = [
        { label: 'Today', date: today },
        { label: 'Tomorrow', date: addDays(today, 1) },
        { label: 'Next Monday', date: nextWeekday(today, 1) },
        { label: 'In 1 week', date: addDays(today, 7) },
    ];

    const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const startDay = firstOfMonth.getDay();
        const gridStart = addDays(firstOfMonth, -startDay);

        const cells: { date: Date; inMonth: boolean }[] = [];
        for (let i = 0; i < 42; i++) {
            const d = addDays(gridStart, i);
            cells.push({ date: d, inMonth: d.getMonth() === month });
        }
        return cells;
    }, [viewMonth]);

    const changeMonth = (delta: number) => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const selectDate = (d: Date) => {
        if (d < min) return;
        onChange(fmt(d));
        setViewMonth(d);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.quickRanges}>
                <div className={styles.quickLabel}>Quick select</div>
                {quickRanges.map(q => (
                    <button
                        type="button"
                        key={q.label}
                        className={`${styles.quickItem} ${value === fmt(q.date) ? styles.quickItemActive : ''}`}
                        onClick={() => selectDate(q.date)}
                        disabled={q.date < min}
                    >
                        {q.label}
                    </button>
                ))}
            </div>

            <div className={styles.calendar}>
                <div className={styles.calHeader}>
                    <button type="button" className={styles.navBtn} onClick={() => changeMonth(-1)} aria-label="Previous month">
                        <ChevronLeft size={16} />
                    </button>
                    <span className={styles.monthLabel}>{monthLabel}</span>
                    <button type="button" className={styles.navBtn} onClick={() => changeMonth(1)} aria-label="Next month">
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className={styles.weekdayRow}>
                    {WEEKDAYS.map(w => <div key={w} className={styles.weekday}>{w}</div>)}
                </div>

                <div className={styles.daysGrid}>
                    {days.map(({ date, inMonth }) => {
                        const key = fmt(date);
                        const isSelected = value === key;
                        const isToday = fmt(today) === key;
                        const isDisabled = date < min;
                        return (
                            <button
                                type="button"
                                key={key}
                                className={`${styles.dayCell}
                                    ${!inMonth ? styles.outsideMonth : ''}
                                    ${isSelected ? styles.selectedDay : ''}
                                    ${isToday && !isSelected ? styles.todayDay : ''}`}
                                disabled={isDisabled}
                                onClick={() => selectDate(date)}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
