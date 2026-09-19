import { notFound } from "next/navigation";
import { requirePlatformRole } from "@/lib/auth/session";
import { resolveFoundationFlags } from "@/lib/product-foundation-flags";
import { DesignLab } from "@/components/system/DesignLab";
export const dynamic = "force-dynamic";
export const metadata = { title: "Synthetic design lab · XeroWA" };
export default async function DesignLabPage() {
  const session = await requirePlatformRole(["admin", "dev"]);
  if (!resolveFoundationFlags(session, process.env).designLab) notFound();
  return (
    <div data-foundation="command" className="x-lab-route">
      <DesignLab />
    </div>
  );
}
