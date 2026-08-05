import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

const ALLOWED_DOMAIN = "auis.edu.krd";

// Whoever created this Semester's row with role ADMIN in the DB (or
// whose email is in ADMIN_EMAILS below) gets the admin dashboard.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Reject anyone outside the AUIS domain before a session is ever created.
    async signIn({ user }) {
      if (!user.email) return false;
      return user.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase();
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: { name: user.name ?? undefined },
          create: {
            email,
            name: user.name ?? undefined,
            role: ADMIN_EMAILS.includes(email) ? "ADMIN" : "STUDENT",
          },
        });
        token.userId = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
