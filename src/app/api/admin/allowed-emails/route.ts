import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

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

  const { rows } = await pool.query('SELECT email FROM allowed_emails ORDER BY email');
  return NextResponse.json(rows.map((r) => r.email));
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await req.json();
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  await pool.query(
    'INSERT INTO allowed_emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
    [email.toLowerCase()]
  );
  return NextResponse.json({ email: email.toLowerCase() }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  await pool.query('DELETE FROM allowed_emails WHERE LOWER(email) = LOWER($1)', [email]);
  return NextResponse.json({ success: true });
}
