"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordExperience() {
  const params = useSearchParams();
  const busy = useRef(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const redirectTo = `${window.location.origin}/account/update-password`;
      const result = await createClient().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo },
      );
      if (result.error) {
        setError(
          "Password recovery is temporarily unavailable. Please wait a moment and try again.",
        );
        return;
      }
      setSent(true);
    } catch {
      setError(
        "Password recovery is temporarily unavailable. Please wait a moment and try again.",
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
        <span>Secure account recovery</span>
      </div>
      <h1>Reset your password.</h1>
      <p>
        We will send a time-limited recovery link to the email assigned to your
        XeroWA workspace.
      </p>

      {params.get("error") === "invalid_or_expired" && (
        <p className="fr-auth-error" role="alert">
          That recovery link is invalid or has expired. Request a new link.
        </p>
      )}

      {sent ? (
        <div className="fr-auth-success" role="status">
          <Mail size={20} aria-hidden="true" />
          <div>
            <h2>Check your email</h2>
            <p>
              If this email belongs to an account, a recovery link is on its
              way. Check spam too. For security, we do not confirm whether an
              account exists.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={requestReset} aria-busy={pending}>
          <label>
            Account email
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
          </label>
          {error && (
            <p className="fr-auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="x-button" type="submit" disabled={pending}>
            {pending ? "Sending recovery link…" : "Send recovery link"}
          </button>
        </form>
      )}

      <Link className="fr-auth-link fr-auth-back" href="/login">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to sign in
      </Link>
    </section>
  );
}
