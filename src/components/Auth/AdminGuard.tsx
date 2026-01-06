'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAdmin = () => {
            try {
                // Strict check: Must have verified via Admin Login Page
                const isVerified = localStorage.getItem('admin_verified') === 'true';

                if (isVerified) {
                    setAuthorized(true);
                } else {
                    // console.warn('Unauthorized access. Redirecting to Admin Login.');
                    router.push('/admin-login');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [router]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f4f7fa'
            }}>
                <div>Loading Admin Access...</div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}
