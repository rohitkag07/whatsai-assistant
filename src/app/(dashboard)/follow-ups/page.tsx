import { notFound } from "next/navigation";
import { requireBusinessAccess } from "@/lib/auth/session";
import { controlEntry } from "@/components/control/ControlEntry";
export const dynamic = "force-dynamic";
export const metadata = { title: "Follow-ups · XeroWA" };
export default async function FollowupsPage() {
  const session = await requireBusinessAccess();
  const control = await controlEntry(session, "followups");
  if (!control) notFound();
  return control;
}
