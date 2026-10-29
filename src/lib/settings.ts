import { pool } from './db';

// Admin-controlled feature flag: Oral Exam bookings are frozen (hidden +
// rejected) by default until the admin explicitly enables them.
export async function isOralExamEnabled(): Promise<boolean> {
  const { rows } = await pool.query(
    "SELECT value FROM app_settings WHERE key = 'oral_exam_enabled'"
  );
  return rows[0]?.value === 'true';
}
