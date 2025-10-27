"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ensureUserAction } from "@/app/actions/ensure-users"; // adjust the path as needed

export default function EnsureUserOnLogin() {
  const { data } = useSession();
  const did = useRef(false);

  useEffect(() => {
    if (!data?.user?.email || did.current) return;
    did.current = true;

    ensureUserAction({
      email: data.user.email,
      name: data.user.name || "",
      image: data.user.image || "",
    }).catch(() => {});
  }, [data?.user?.email]);

  return null;
}
