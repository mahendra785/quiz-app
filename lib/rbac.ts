import { authOptions } from "./auth";
import { getServerSession } from "next-auth";
import { getUserByEmailAction } from "@/app/actions/users";
export async function assertRole(
  allowed: Array<"admin"|"creator"|"learner">
): Promise<{ email: string; role: "admin"|"creator"|"learner" }> {
  const session = await getServerSession(authOptions); // ✅ v4 way
  const email = session?.user?.email;
    const user = session?.user?.email;
    console.log("Current user email:", user);
    const userobj = await getUserByEmailAction(user || "");
    console.log("User role:", userobj?.role);
  if (!email || !userobj?.role || !allowed.includes(userobj?.role)) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }
  return { email, role: userobj.role };
}
