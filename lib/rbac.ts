import { authOptions } from "./auth";
import { getServerSession } from "next-auth";
export async function assertRole(
  allowed: Array<"admin"|"creator"|"learner">
): Promise<{ email: string; role: "admin"|"creator"|"learner" }> {
  const session = await getServerSession(authOptions); // ✅ v4 way
  const email = session?.user?.email;
  const role = session?.user?.role as any;
  if (!email || !role || !allowed.includes(role)) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
  return { email, role };
}
