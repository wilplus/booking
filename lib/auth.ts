import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
if (!adminEmail && process.env.NODE_ENV === "production") {
  console.warn("ADMIN_EMAIL is not set; admin access will be denied.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      const email = user?.email?.toLowerCase().trim();
      if (!adminEmail) return false;
      if (email === adminEmail) return true;
      return false;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/admin/sign-in",
    error: "/admin/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
