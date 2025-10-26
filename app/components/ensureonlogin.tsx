"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function EnsureUserOnLogin() {
  const { data } = useSession();
  const did = useRef(false);

  useEffect(() => {
    if (!data?.user?.email || did.current) return;
    did.current = true;
    (async () => {
      try {
        const fd = new FormData();
        fd.set("email", data.user.email || "");
        fd.set("name", data.user.name || "");
        fd.set("image", data.user.image || "");
        await fetch("/actions/ensure-users", { method: "POST", body: fd });
      } catch {}
    })();
  }, [data?.user?.email]);

  return null;
}
