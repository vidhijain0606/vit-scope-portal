import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/utils/accessControl';

// Lets a client component re-validate the current session's email against
// the live allowlist (e.g. DashboardView catches the case where an admin
// has since removed someone whose session/JWT is still valid). The
// DB-backed checkAccess() itself can't be imported into a client bundle, so
// this is the client-safe entry point to it.
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ isAllowed: false, reason: 'Not signed in.' }, { status: 401 });
  }

  const result = await checkAccess(session.user.email);
  return NextResponse.json(result);
}
