import React from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import AdminTopbar from '@/components/Admin/AdminTopbar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Sidebar />
            <div style={{ marginLeft: '260px', minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
                <AdminTopbar />
                <main>
                    {children}
                </main>
            </div>
        </>
    );
}
