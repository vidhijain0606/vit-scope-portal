'use client';
import React from 'react';
import styles from './AdminTopbar.module.css';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

const AdminTopbar = () => {
    const router = useRouter();
    const [name, setName] = React.useState('Admin');

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setName(user.user_metadata?.full_name || user.email || 'Admin');
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
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
