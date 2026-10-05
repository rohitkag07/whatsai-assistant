"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createImplicitRecoveryClient } from "@/lib/supabase/client";
import {
  getPasswordUpdateErrorMessage,
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "@/lib/auth/password-recovery";

type RecoveryState = "checking" | "ready" | "invalid";

export function UpdatePasswordExperience() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createImplicitRecoveryClient> | null>(null);
  const busy = useRef(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createImplicitRecoveryClient();
    supabaseRef.current = supabase;
    let active = true;
    const timeout = window.setTimeout(async () => {
      const result = await supabase.auth.getUser();
      if (active) setRecoveryState(result.data.user ? "ready" : "invalid");
    }, 500);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setRecoveryState("ready");
      }
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || recoveryState !== "ready") return;
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const supabase = supabaseRef.current ?? createImplicitRecoveryClient();
      const result = await supabase.auth.updateUser({ password });
      if (result.error) {
        setError(getPasswordUpdateErrorMessage(result.error));
        return;
      }
      await supabase.auth.signOut();
      router.replace("/login?password=updated");
      router.refresh();
    } catch {
      setError("We could not update the password. Request a new recovery link.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <section className="fr-auth-card">
      <div className="fr-auth-mark">
        <KeyRound size={20} aria-hidden="true" />
        <span>Protected password update</span>
      </div>
      <h1>Choose a new password.</h1>
      <p>
        Use a unique password with at least {MIN_PASSWORD_LENGTH} characters.
        You will sign in again after it is updated.
      </p>

      {recoveryState === "checking" && (
        <p className="fr-auth-status" role="status">
          Verifying your recovery link…
        </p>
      )}
      {recoveryState === "invalid" && (
        <div className="fr-auth-error" role="alert">
          This recovery session is invalid or expired. Return to password
          recovery and request a new link.
          <a href="/forgot-password">Request a new recovery link</a>
        </div>
      )}
      {recoveryState === "ready" && (
        <form onSubmit={updatePassword} aria-busy={pending}>
          <label>
            New password
            <input
              type="password"
              name="new-password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={pending}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={pending}
            />
          </label>
          {error && (
            <p className="fr-auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="x-button" type="submit" disabled={pending}>
            {pending ? "Updating password…" : "Update password"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
      )}
    </section>
  );
}
