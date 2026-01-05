import React from 'react';
import Navbar from '@/components/Layout/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 65px)' }}>
                {children}
            </main>
        </>
    );
}
