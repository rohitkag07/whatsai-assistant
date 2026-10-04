"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeReturnPath } from "@/lib/first-run/model";
export function LoginExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const busy = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (result.error) {
        setError(
          "We could not sign you in. Check your email and password, then try again.",
        );
        return;
      }
      router.replace(safeReturnPath(params.get("next")));
      router.refresh();
    } catch {
      setError(
        "Sign-in is unavailable right now. Your details were not saved here. Please try again when access is restored.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <section className="fr-auth-card">
      <div className="fr-auth-mark">
        <KeyRound size={20} aria-hidden="true" />
        <span>Authorized workspace access</span>
      </div>
      <h1>
        Bring every enquiry
        <br />
        to a clear next step.
      </h1>
      <p>
        Sign in to your business workspace. Set the rules, review the handoff
        and keep follow-up accountable.
      </p>
      {params.get("password") === "updated" && (
        <p className="fr-auth-success fr-auth-success-inline" role="status">
          Password updated. Sign in with your new password.
        </p>
      )}
      <form onSubmit={signIn} aria-busy={pending}>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </label>
        {error && (
          <p className="fr-auth-error" role="alert">
            {error}
          </p>
        )}
        <button className="x-button" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        {pending && (
          <p role="status">
            Verifying your account. Workspace membership is checked next.
          </p>
        )}
      </form>
      <Link className="fr-auth-link" href="/forgot-password">
        Need help with access?
      </Link>
      <p className="fr-auth-footnote">
        New account? Business membership is required. Signing in alone does not
        grant access or activate messaging.
      </p>
    </section>
  );
}
