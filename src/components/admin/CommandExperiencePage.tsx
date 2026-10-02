import 'server-only';
import type { AuthSession } from '@/lib/auth/session';
import { commandEnabled, commandSyntheticEnabled, unavailableCommand, type CommandView } from '@/lib/command/model';
import { syntheticCommand } from '@/lib/command/fixtures';
import { CommandWorkspace } from './CommandWorkspace';

// No service client, health probe, endpoint or second approval authority is invoked.
export function commandExperience(session: AuthSession, view: CommandView, systemView: 'health' | 'webhooks' | 'audit' = 'health') {
  if (!commandEnabled(session, process.env)) return null;
  const synthetic = commandSyntheticEnabled(session, process.env);
  return <CommandWorkspace initialView={view} initialSystemView={systemView} snapshot={synthetic ? syntheticCommand() : unavailableCommand()} />;
}
