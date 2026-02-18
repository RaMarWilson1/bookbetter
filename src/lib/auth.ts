// src/lib/auth.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/sign-in',
    newUser: '/onboarding',
    error: '/auth/error',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user[0]) {
          throw new Error('No account found with this email');
        }

        if (!user[0].password) {
          throw new Error(
            'This account uses Google or Apple sign-in. Please use that method instead.'
          );
        }

        const isValid = await bcrypt.compare(password, user[0].password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          image: user[0].image,
          role: user[0].role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'client';
      }

      if (account && account.provider !== 'credentials' && user?.email) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email.toLowerCase()))
          .limit(1);

        if (dbUser[0]) {
          token.role = dbUser[0].role;
        }
      }

      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});