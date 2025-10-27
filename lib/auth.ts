// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureUserAction } from "../app/actions/ensure-users";
function envRole(email?: string | null): "admin" | "creator" | "learner" {
  try {
    const admins = JSON.parse(process.env.ADMIN_EMAILS || "[]") as string[];
    const creators = JSON.parse(process.env.CREATOR_EMAILS || "[]") as string[];
    if (email && admins.includes(email)) return "admin";
    if (email && creators.includes(email)) return "creator";
  } catch {}
  return "learner";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token }) {
      (token as any).role = (token as any).role || envRole(token.email);
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      (session.user as any).role = (token as any).role;
      return session;
    },
      async signIn({ user }) {
    await ensureUserAction({
      email: user.email!,
      name: user.name || "",
      image: user.image || "",
    });
    return true;
  }
  },
};
