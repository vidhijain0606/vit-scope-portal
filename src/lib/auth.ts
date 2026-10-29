import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { pool } from './db';
import { checkAccess } from '@/utils/accessControl';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: 'admin',
      name: 'Admin',
      credentials: {
        username: { label: 'Admin ID' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        const { rows } = await pool.query(
          'SELECT id, username, password_hash FROM admins WHERE username = $1',
          [username]
        );
        const admin = rows[0];
        if (!admin) return null;

        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) return null;

        return { id: admin.id, name: admin.username, role: 'admin' };
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === 'google') {
        const { isAllowed } = checkAccess(user.email);
        return isAllowed;
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user && 'role' in user) {
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: { strategy: 'jwt' },
  // Required on Azure App Service (and most non-Vercel hosts): Auth.js only
  // trusts the request Host header automatically on Vercel, otherwise every
  // auth route throws "UntrustedHost" even with NEXTAUTH_URL set correctly.
  trustHost: true,
});
