import React from 'react';
import { Calendar, User, FlaskConical, ChevronDown } from 'lucide-react';
import styles from './FilterBar.module.css';

const FilterBar = () => {
    return (
        <div className={styles.filterBar}>
            <span className={styles.label}>FILTER BY:</span>

            <div className={styles.filterGroup}>
                <div className={styles.dropdown}>
                    <Calendar size={16} className={styles.icon} />
                    <span>Date Range</span>
                    <ChevronDown size={14} className={styles.arrow} />
                </div>

                <div className={styles.dropdown}>
                    <User size={16} className={styles.icon} />
                    <span>Faculty Member</span>
                    <ChevronDown size={14} className={styles.arrow} />
                </div>

                <div className={styles.dropdown}>
                    <FlaskConical size={16} className={styles.icon} />
                    <span>Research Area</span>
                    <ChevronDown size={14} className={styles.arrow} />
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
