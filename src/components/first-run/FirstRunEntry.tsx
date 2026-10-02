import type { AuthSession } from "@/lib/auth/session";
import { firstRunEnabled } from "@/lib/first-run/flags";
import { loadReadiness } from "@/lib/first-run/loader";
import { ReadinessCard } from "./ReadinessCard";
export async function firstRunEntry(session: AuthSession) {
  if (!firstRunEnabled(session, process.env)) return null;
  return <ReadinessCard snapshot={await loadReadiness(session)} />;
}
