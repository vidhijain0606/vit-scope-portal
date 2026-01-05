import React from 'react';
import styles from './FilterBar.module.css';

const FilterBar = () => {
    return (
        <div className={styles.filterBar}>
            <span className={styles.label}>FILTER BY:</span>

            <div className={styles.filterGroup}>
                <div className={styles.dropdown}>
                    <span className={styles.icon}>📅</span>
                    <span>Date Range</span>
                    <span className={styles.arrow}>▼</span>
                </div>

                <div className={styles.dropdown}>
                    <span className={styles.icon}>👤</span>
                    <span>Faculty Member</span>
                    <span className={styles.arrow}>▼</span>
                </div>

                <div className={styles.dropdown}>
                    <span className={styles.icon}>⚗️</span>
                    <span>Research Area</span>
                    <span className={styles.arrow}>▼</span>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
