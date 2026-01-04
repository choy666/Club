import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import type { AdapterUser } from "@auth/core/adapters";
import { db } from "@/db/client";
import { accounts, sessions, users, verificationTokens, type UserRole } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { env } from "@/lib/env";

async function getUserRole(email?: string | null) {
  if (!email) return "USER" satisfies UserRole;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
    columns: { role: true },
  });

  return (user?.role ?? "USER") satisfies UserRole;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const emailInput = credentials?.email;
        const passwordInput = credentials?.password;

        if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
          throw new Error("Debes ingresar correo y contraseña.");
        }

        const email = emailInput.toLowerCase().trim();
        const password = passwordInput.trim();

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user || !user.passwordHash) {
          throw new Error("Credenciales inválidas.");
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          throw new Error("Credenciales inválidas.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const adapterUser = user as AdapterUser & { role?: UserRole | null };
        token.role = adapterUser.role ?? token.role ?? "USER";
        token.email = adapterUser.email ?? token.email;
        token.userId = adapterUser.id;
      } else if (!token.role && token.email) {
        token.role = await getUserRole(token.email);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as UserRole) ?? "USER";
        session.user.id = (token.userId as string) ?? session.user.id;
      }

      return session;
    },
  },
});
