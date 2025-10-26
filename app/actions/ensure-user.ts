import { NextResponse } from "next/server";
import { ensureUserAction } from "@/app/actions/users";

export async function POST(req: Request) {
  const fd = await req.formData();
  const email = String(fd.get("email") ?? "");
  const name  = String(fd.get("name") ?? "");
  const image = String(fd.get("image") ?? "");
  const user = await ensureUserAction({ email, name, image, defaultRole: "learner" });
  return NextResponse.json({ ok: true, user });
}
