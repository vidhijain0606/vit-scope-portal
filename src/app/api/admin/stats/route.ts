import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows: statusRows } = await pool.query('SELECT status FROM bookings');
  const total = statusRows.length;
  const confirmed = statusRows.filter(
    (b) => b.status === 'upcoming' || b.status === 'confirmed'
  ).length;
  const cancelled = statusRows.filter((b) => b.status === 'cancelled').length;

  const { rows: userCountRows } = await pool.query('SELECT COUNT(*) FROM users');
  const totalUsers = parseInt(userCountRows[0].count, 10) || 0;

  return NextResponse.json({
    totalBookings: total,
    confirmedSlots: confirmed,
    cancelledSlots: cancelled,
    totalUsers,
  });
}
