'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Clock, FileUp, Calendar, FileDown } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => {
        return pathname === path ? styles.active : '';
    };

    const handleLogout = () => {
        router.push('/');
    };

    return (
        <aside className={styles.sidebar}>
            <div className={styles.brand}>
                <div className={styles.logoIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#0d6efd" />
                        <path d="M2 17L12 22L22 17" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="#0d6efd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className={styles.brandText}>
                    <span className={styles.brandTitle}>VIT SCOPE</span>
                    <span className={styles.brandSubtitle}>RESEARCH PORTAL</span>
                </div>
            </div>

            <nav className={styles.nav}>
                {/* Admin Links */}
                {pathname.startsWith('/admin') && (
                    <>
                        <Link href="/admin/dashboard" className={`${styles.navItem} ${isActive('/admin/dashboard')}`}>
                            <LayoutDashboard size={20} className={styles.icon} />
                            Dashboard
                        </Link>
                        <Link href="/admin/add-slots" className={`${styles.navItem} ${isActive('/admin/add-slots')}`}>
                            <Clock size={20} className={styles.icon} />
                            Add Slots
                        </Link>
                        <Link href="/admin/documents" className={`${styles.navItem} ${isActive('/admin/documents')}`}>
                            <FileUp size={20} className={styles.icon} />
                            Documents (Upload)
                        </Link>
                    </>
                )}

                {/* Faculty/Dashboard Links */}
                {pathname.startsWith('/dashboard') && (
                    <>
                        <Link href="/dashboard" className={`${styles.navItem} ${isActive('/dashboard')}`}>
                            <Calendar size={20} className={styles.icon} />
                            My Schedule
                        </Link>
                        <Link href="/dashboard/documents" className={`${styles.navItem} ${isActive('/dashboard/documents')}`}>
                            <FileDown size={20} className={styles.icon} />
                            Documents
                        </Link>
                    </>
                )}
            </nav>

            <div className={styles.footer}>
                <div className={styles.userProfile}>
                    <div className={styles.avatar}>
                        <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" />
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>Admin</span>
                        <span className={styles.userRole}>Super Admin</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
