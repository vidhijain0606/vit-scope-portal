import React from 'react';
import styles from './AdminTopbar.module.css';

const AdminTopbar = () => {
    return (
        <header className={styles.topbar}>
            <div className={styles.breadcrumb}>
                <span className={styles.homeLink}>Home</span>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>Admin Dashboard</span>
                <span className={styles.separator}>/</span>
                <span className={styles.sub}>Data Export</span>
            </div>

            <div className={styles.actions}>
                <div className={styles.adminProfile}>
                    <div className={styles.avatar}>A</div>
                    <span className={styles.adminName}>Admin</span>
                </div>
            </div>
        </header>
    );
};

export default AdminTopbar;
