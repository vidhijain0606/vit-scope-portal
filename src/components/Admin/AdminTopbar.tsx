'use client';
import React from 'react';
import styles from './AdminTopbar.module.css';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const AdminTopbar = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const name = session?.user?.name || session?.user?.email || 'Admin';

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.breadcrumb}>
                <span className={styles.homeLink}>Home</span>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>Admin Dashboard</span>
            </div>

            <div className={styles.actions}>
                <div className={styles.adminProfile}>
                    <div className={styles.avatar}>A</div>
                    <div className={styles.profileInfo}>
                        <span className={styles.adminName}>Admin</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        marginLeft: '1rem',
                        padding: '0.5rem 1rem',
                        border: '1px solid #ddd',
                        borderRadius: '0.375rem',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default AdminTopbar;
