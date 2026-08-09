import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Returns the session if the caller is an authenticated admin, otherwise null.
// Every admin-only API route should start with this and bail on null.
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}
