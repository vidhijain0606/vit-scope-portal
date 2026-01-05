import React from 'react';
import Navbar from '@/components/Layout/Navbar';

export default function BookSlotLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 65px)', backgroundColor: '#f4f7fa' }}>
                {children}
            </main>
        </>
    );
}
