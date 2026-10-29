import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

// Read-only, for any signed-in user (not just admins) — the booking page
// needs to know if Oral Exam bookings are currently frozen.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rows } = await pool.query(
    "SELECT key, value FROM app_settings WHERE key = 'oral_exam_enabled'"
  );
  const oralExamEnabled = rows[0]?.value === 'true';
  return NextResponse.json({ oralExamEnabled });
}
