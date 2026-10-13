import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { item_name, quantity, category } = await req.json();
  const { rows } = await pool.query(
    `INSERT INTO stocks (item_name, quantity, category, status)
     VALUES ($1, $2, $3, 'In Stock') RETURNING *`,
    [item_name, quantity, category]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
