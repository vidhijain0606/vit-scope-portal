'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import Button from '../UI/Button';

import { supabase } from '@/utils/supabase';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => {
        return pathname === path ? styles.active : '';
    };

    const [avatarUrl, setAvatarUrl] = React.useState('https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff');

    React.useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Use Google avatar if available, otherwise generated initials
                const picture = user.user_metadata?.avatar_url;
                const name = user.user_metadata?.full_name || user.email || 'User';

                if (picture) {
                    setAvatarUrl(picture);
                } else {
                    setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`);
                }
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        try {
            // Perform sign out
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error logging out:', error);

            // Hard redirect to clear any state
            window.location.href = '/';
        } catch (error) {
            console.error('Unexpected error logging out:', error);
            window.location.href = '/';
        }
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
