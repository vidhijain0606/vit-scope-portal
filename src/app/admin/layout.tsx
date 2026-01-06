import React from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import AdminTopbar from '@/components/Admin/AdminTopbar';
import AdminGuard from '@/components/Auth/AdminGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminGuard>
            <Sidebar />
            <div style={{ marginLeft: '260px', minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
                <AdminTopbar />
                <main>
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
