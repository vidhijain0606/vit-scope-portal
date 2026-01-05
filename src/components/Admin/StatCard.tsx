import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    icon: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, color }) => {
    return (
        <div className={styles.card}>
            <div className={styles.content}>
                <div className={styles.title}>{title}</div>
                <div className={styles.value}>{value}</div>
                {trend && <div className={styles.trend} style={{ color: '#198754' }}>{trend}</div>}
            </div>
            <div className={styles.iconBox} style={{ backgroundColor: color }}>
                <span className={styles.icon}>{icon}</span>
            </div>
        </div>
    );
};

export default StatCard;
