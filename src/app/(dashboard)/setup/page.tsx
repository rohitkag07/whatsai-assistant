import { notFound, redirect } from "next/navigation";
import { requireBusinessAccess } from "@/lib/auth/session";
import {
  firstRunEnabled,
  ownerCanConfigure,
  syntheticFirstRun,
} from "@/lib/first-run/flags";
import { loadReadiness } from "@/lib/first-run/loader";
import { FirstRunJourney } from "@/components/first-run/FirstRunJourney";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  const session = await requireBusinessAccess();
  if (!session.activeBusinessId) redirect("/guard");
  if (!firstRunEnabled(session, process.env)) notFound();
  const synthetic = syntheticFirstRun(session, process.env);
  if (
    !synthetic &&
    !session.memberships.some(
      (m) => m.active && m.business_id === session.activeBusinessId,
    )
  )
    redirect("/guard");
  return (
    <FirstRunJourney
      key={`${session.user.id}:${session.activeBusinessId}`}
      scope={{
        actorId: session.user.id,
        tenantContext: session.activeBusinessId,
      }}
      snapshot={await loadReadiness(session)}
      canEdit={ownerCanConfigure(session) || synthetic}
    />
  );
}
