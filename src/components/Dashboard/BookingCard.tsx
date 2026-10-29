import React from 'react';
import { Clock, Video, MapPin, ExternalLink } from 'lucide-react';
import styles from './BookingCard.module.css';
import Button from '../UI/Button';

export interface BookingCardProps {
    id: string;
    title: string;
    date: { month: string; day: string };
    time: string;
    isOnline?: boolean;
    student: { name: string; regNo: string; avatar?: string };
    status: 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
    onCancel?: (id: string) => void;
    dateStr?: string;     // For filtering logic
    meeting_type?: string; // For filtering logic
}

const BookingCard: React.FC<BookingCardProps> = ({
    id,
    title,
    date,
    time,
    isOnline,
    student,
    status,
    onCancel,
    dateStr,
}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = !!dateStr && dateStr < todayStr;

    return (
        <div className={styles.card}>
            {/* Col 1: infoGroup (Date + Details) */}
            <div className={styles.infoGroup}>
                <div className={styles.dateBox}>
                    <div className={styles.month}>{date.month}</div>
                    <div className={styles.day}>{date.day}</div>
                </div>

                <div className={styles.content}>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={styles.details}>
                        <Clock size={16} className={styles.icon} />
                        <span>{time}</span>
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

            {/* Col 2: statusGroup (Middle) */}
            <div className={styles.statusGroup}>
                {isPast ? (
                    <span
                        style={{
                            background: '#e5e7eb',
                            color: '#4b5563',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                        }}
                    >
                        {status} &amp; Completed
                    </span>
                ) : (
                    <>
                        {['upcoming', 'pending'].includes(status) && (
                            <span className={styles.pendingBadge}>Waiting for Dean's Confirmation...</span>
                        )}

                        {status === 'confirmed' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (window.confirm("You are being redirected to VTOP to complete the booking. Continue?")) {
                                        window.open('https://vtop.vit.ac.in', '_blank');
                                    }
                                }}
                            >
                                Go to VTOP <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Col 3: actionGroup (Right - Cancel) */}
            <div className={styles.actionGroup}>
                {!isPast && (status === 'upcoming' || status === 'confirmed') && onCancel && (
                    <button
                        className={styles.cancelLink}
                        onClick={() => onCancel(id)}
                    >
                        Cancel
                    </button>
                )}
                {/* Join Meeting button hidden as mainly offline focus, or user said "cancel button is lost" */}
                {!isPast && isOnline && status === 'upcoming' && (
                    <Button variant="primary" size="sm">Join</Button>
                )}
            </div>
        </div >
    );
};

export default BookingCard;
