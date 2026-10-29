'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import Button from '../UI/Button';

import { useSession, signOut } from 'next-auth/react';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const isActive = (path: string) => {
        return pathname === path ? styles.active : '';
    };

    const name = session?.user?.name || session?.user?.email || 'User';
    const avatarUrl = session?.user?.image
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`;

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.brand}>
                    <div className={styles.logoIcon}>
                        <Image
                            src="/images/vit_favicon.jpg"
                            alt="VIT Logo"
                            width={32}
                            height={32}
                            className={styles.logoImage}
                            unoptimized
                        />
                    </div>
                    <span className={styles.brandName}>VIT SCOPE RESEARCH PORTAL</span>
                </div>

                <div className={styles.navLinks}>
                    <Link href="/dashboard" className={`${styles.navLink} ${isActive('/dashboard')}`}>
                        Dashboard
                    </Link>
                    <Link href="/book-slot" className={`${styles.navLink} ${isActive('/book-slot')}`}>
                        Book Slot
                    </Link>
                    <Link href="/dashboard/documents" className={`${styles.navLink} ${isActive('/dashboard/documents')}`}>
                        Documents
                    </Link>
                </div>

                <div className={styles.userActions}>
                    <div className={styles.avatar}>
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
