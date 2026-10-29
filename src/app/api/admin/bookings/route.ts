import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';
import { notifyFacultyOfConfirmation } from '@/lib/mail';

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    'SELECT * FROM bookings ORDER BY date DESC, start_time ASC'
  );
  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await req.json();
  const { rows } = await pool.query(
    'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const booking = rows[0];
  if (status === 'confirmed' && booking.emp_email) {
    notifyFacultyOfConfirmation({
      facultyEmail: booking.emp_email,
      facultyName: booking.emp_name,
      meetingType: booking.meeting_type || booking.title,
      date: new Date(booking.date).toISOString().split('T')[0],
      startTime: (booking.start_time as string).slice(0, 5),
      endTime: (booking.end_time as string).slice(0, 5),
      scholarName: booking.scholar_name,
      scholarId: booking.scholar_id,
    }).catch((err) => console.error('Failed to send faculty confirmation email', err));
  }

  return NextResponse.json(booking);
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
