import React from 'react';
import styles from './BookingCard.module.css';
import Button from '../UI/Button';

interface BookingCardProps {
    id: string;
    title: string;
    date: { month: string; day: string };
    time: string;
    location: string;
    isOnline?: boolean;
    student: { name: string; regNo: string; avatar?: string };
    status: 'upcoming' | 'completed' | 'cancelled';
    onCancel?: (id: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
    id,
    title,
    date,
    time,
    location,
    isOnline,
    student,
    status,
    onCancel
}) => {
    return (
        <div className={styles.card}>
            <div className={styles.dateBox}>
                <div className={styles.month}>{date.month}</div>
                <div className={styles.day}>{date.day}</div>
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                </div>

                <div className={styles.details}>
                    <div className={styles.detailRow}>
                        <span className={styles.icon}>🕒</span>
                        <span>{time}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.icon}>{isOnline ? '📹' : '📍'}</span>
                        <span className={isOnline ? styles.online : ''}>{location}</span>
                    </div>

                    <div className={styles.studentInfo}>
                        <div className={styles.avatar}>
                            <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt={student.name} />
                        </div>
                        <span className={styles.studentName}>{student.name}</span>
                        <span className={styles.regNo}>{student.regNo}</span>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                {status === 'upcoming' && onCancel && (
                    <button
                        className={styles.cancelLink}
                        onClick={() => onCancel(id)}
                    >
                        Cancel
                    </button>
                )}

                {isOnline && status === 'upcoming' ? (
                    <Button variant="primary" size="sm">
                        Join Meeting 📹
                    </Button>
                ) : (
                    <Button variant={status === 'cancelled' ? 'secondary' : 'primary'} size="sm" disabled={status === 'cancelled'}>
                        View Details →
                    </Button>
                )}
            </div>
        </div>
    );
};

export default BookingCard;
