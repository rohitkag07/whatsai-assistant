import type { ShellReadResult, ShellReadState } from "@/lib/auth/shell-types";
export type SystemStateKind =
  | "loading"
  | "empty"
  | "error"
  | "disconnected"
  | "permission"
  | "unknown"
  | "partial";
export function readableCount(result: ShellReadResult<number>): number | null {
  return (result.status === "ready" || result.status === "empty") &&
    Number.isFinite(result.data) &&
    result.data >= 0
    ? result.data
    : null;
}
export function shellPresentation(
  state: ShellReadState,
): SystemStateKind | null {
  if (state.businesses.status === "disconnected") return "disconnected";
  if (state.businesses.status === "error") return "error";
  if (state.businesses.status === "unknown") return "unknown";
  if (state.businesses.status === "empty") return "empty";
  if (readableCount(state.unread) === null) return "partial";
  return null;
}
