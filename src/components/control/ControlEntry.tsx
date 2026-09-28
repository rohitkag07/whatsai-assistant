import "server-only";
import type { AuthSession } from "@/lib/auth/session";
import {
  controlEnabled,
  syntheticEnabled,
  readEnabled,
} from "@/lib/control/flags";
import { projectSnapshot, unavailableModel } from "@/lib/control/adapter";
import type { View } from "@/lib/control/model";
import { ControlWorkspace } from "./ControlWorkspace";

export async function controlEntry(session: AuthSession, view: View) {
  if (!controlEnabled(session, process.env) || !session.activeBusinessId)
    return null;
  let data = unavailableModel(session.activeBusinessId);
  if (syntheticEnabled(process.env)) {
    const { syntheticSnapshot } = await import("@/lib/control/fixtures");
    data = projectSnapshot(
      syntheticSnapshot(session.activeBusinessId),
      session.activeBusinessId,
    );
  } else if (readEnabled(process.env)) {
    const { loadControlRead } = await import("@/lib/control/supabase-reader");
    data = await loadControlRead(session);
  }
  return (
    <ControlWorkspace
      key={`${session.user.id}:${session.activeBusinessId}:${view}`}
      initial={data}
      view={view}
    />
  );
}
