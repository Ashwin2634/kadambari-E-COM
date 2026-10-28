import { NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Email",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        await connectDB();
        const u = await User.findOne({ email: creds.email.toLowerCase() }).select("+passwordHash");
        if (!u || !(await bcrypt.compare(creds.password, u.passwordHash))) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { id: String(u._id), name: u.name, email: u.email, role: u.role } as any;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (user) { token.role = (user as any).role; token.uid = user.id; }
      return token;
    },
    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (session.user) { (session.user as any).role = token.role; (session.user as any).id = token.uid; }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

/** Use at the top of every admin API route. Returns null if authorised, else a 401/403 Response. */
export async function requireAdmin() {
  const s = await getSession();
  const json = (error: string, status: number) =>
    new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });
  if (!s?.user) return json("Unauthenticated", 401);
  if (s.user.role !== "admin") return json("Forbidden", 403);
  return null;
}
