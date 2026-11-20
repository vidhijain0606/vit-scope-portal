import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Layout/Sidebar';
import AdminTopbar from '@/components/Admin/AdminTopbar';
import AdminGuard from '@/components/Auth/AdminGuard';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Server-side check beneath middleware.ts and ahead of the client-only
    // <AdminGuard> (VAPT-05) — this is the layer middleware.ts can't fully
    // replace for Server Component rendering.
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
        redirect('/admin-login');
    }

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
