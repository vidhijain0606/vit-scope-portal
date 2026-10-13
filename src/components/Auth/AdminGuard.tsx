'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const loading = status === 'loading';
    const authorized = (session?.user as { role?: string } | undefined)?.role === 'admin';

    useEffect(() => {
        if (status !== 'loading' && !authorized) {
            router.push('/admin-login');
        }
    }, [status, authorized, router]);

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
