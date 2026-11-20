import { pool } from '@/lib/db';

/**
 * Access Control Utility
 *
 * Determines which faculty emails are allowed to sign in. The allowlist
 * lives in the `allowed_emails` database table (managed by the admin via
 * /admin/add-slots), not hardcoded in source (VAPT-15) — a plaintext list
 * of real people's emails in source control is itself a PII exposure, and
 * every access change previously required a code change and redeploy.
 *
 * Server-only: this queries `pool` directly, so it must only be imported
 * from server code (route handlers, server components, auth callbacks),
 * never from a client component.
 */
export const checkAccess = async (
    email: string | undefined | null
): Promise<{ isAllowed: boolean; reason?: string }> => {
    if (!email) return { isAllowed: false, reason: 'No email provided.' };

    const { rows } = await pool.query(
        'SELECT 1 FROM allowed_emails WHERE LOWER(email) = LOWER($1)',
        [email]
    );

    if (rows.length > 0) {
        return { isAllowed: true };
    }

    return { isAllowed: false, reason: 'Access is restricted to authorized faculty accounts.' };
};
