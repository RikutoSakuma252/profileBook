import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const allowed = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase();
      if (!allowed || !email.endsWith(`@${allowed}`)) {
        return "/login?error=domain";
      }

      await prisma.user.upsert({
        where: { email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: "viewer",
        },
      });
      return true;
    },

    async jwt({ token, user }) {
      const email = (user?.email ?? token.email)?.toLowerCase();
      if (email && !token.role) {
        const db = await prisma.user.findUnique({ where: { email } });
        if (db) {
          token.id = db.id;
          token.role = db.role as UserRole;
          token.email = db.email;
        }
      }
      return token;
    },
  },
});
