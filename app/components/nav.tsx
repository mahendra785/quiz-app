"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { getUserByEmailAction } from "../actions/users";

export default function Nav() {
  const { data } = useSession();
  const email = data?.user?.email;
  const role = getUserByEmailAction(email || "").then(
    (userobj) => userobj?.role
  );
  return (
    <header className="header">
      <div className="nav">
        <Link href="/" className="badge">
          QuizLab
        </Link>
        {(role.toString() === "admin" || role.toString() === "creator") && (
          <Link href="/creator">Creator</Link>
        )}
        {role.toString() === "admin" && <Link href="/admin">Admin</Link>}

        <div className="grow" />
        {data?.user ? (
          <>
            <span className="pill">
              {data.user.email}
              {role ? ` • ${role}` : ""}
            </span>
            <button className="btn-outline" onClick={() => signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <a className="btn" href="/api/auth/signin/google">
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
