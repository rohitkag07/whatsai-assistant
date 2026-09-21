import { notFound } from "next/navigation";
import { requirePlatformRole } from "@/lib/auth/session";
import { onboardingEnabled } from "@/lib/onboarding/flags";
import { OnboardingWorkspace } from "@/components/onboarding/OnboardingWorkspace";
export const dynamic = "force-dynamic";
export const metadata = { title: "Business onboarding · XeroWA" };
export default async function OnboardingPage() {
  const session = await requirePlatformRole(["admin", "dev"]);
  if (!onboardingEnabled(session, process.env)) notFound();
  const scope = {
    actorId: session.user.id,
    tenantContext: session.activeBusinessId,
  };
  return <OnboardingWorkspace key={JSON.stringify(scope)} scope={scope} />;
}
