import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as UserRole) ?? "viewer";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth;
      const role = (auth?.user?.role as UserRole | undefined) ?? "viewer";
      const isAdmin = role === "admin";
      const { pathname } = nextUrl;

      if (pathname.startsWith("/admin")) {
        if (!loggedIn) return false;
        if (!isAdmin) return NextResponse.redirect(new URL("/?forbidden=1", nextUrl));
        return true;
      }

      if (pathname.startsWith("/api/admin")) {
        if (!loggedIn || !isAdmin) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        return true;
      }

      if (pathname.startsWith("/profiles")) {
        return loggedIn;
      }

      if (pathname.startsWith("/presentations")) {
        return loggedIn;
      }

      return true;
    },
  },
};
