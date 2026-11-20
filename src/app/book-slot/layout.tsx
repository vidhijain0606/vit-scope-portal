import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Navbar from '@/components/Layout/Navbar';

export default async function BookSlotLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Defense-in-depth beneath middleware.ts — this route previously had no
    // server-side auth check at all (VAPT-05).
    const session = await auth();
    if (!session) {
        redirect('/');
    }

    return (
        <>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 65px)', backgroundColor: '#f4f7fa' }}>
                {children}
            </main>
        </>
    );
}
