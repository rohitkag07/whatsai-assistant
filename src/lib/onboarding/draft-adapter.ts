import { z } from "zod";
import { draftSchema, type DraftScope, type OnboardingDraft } from "./model";
import { parseDraft } from "./validation";
export type StoragePort = Pick<Storage, "getItem" | "setItem">;
export type LockPort = <T>(key: string, work: () => T) => Promise<T>;
export type DraftErrorKind =
  | "permission"
  | "disconnected"
  | "corrupt"
  | "conflict"
  | "capacity"
  | "error";
export class DraftError extends Error {
  constructor(
    public kind: DraftErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "DraftError";
  }
}
const envelopeSchema = z
  .object({ version: z.literal(1), drafts: z.array(draftSchema).max(10) })
  .strict();
export function scopeKey(scope: DraftScope) {
  if (
    !scope.actorId ||
    scope.actorId.length > 200 ||
    (scope.tenantContext !== null &&
      (!scope.tenantContext || scope.tenantContext.length > 200))
  )
    throw new DraftError("permission", "A valid workspace is required.");
  return (
    "xerowa:onboarding:v1:" +
    JSON.stringify([scope.actorId, scope.tenantContext])
  );
}
function reportError(error: unknown): never {
  if (error instanceof DraftError) throw error;
  if (error instanceof Error && error.name === "SecurityError")
    throw new DraftError(
      "permission",
      "This browser has denied local draft storage. Your unsaved edits are still on this page.",
    );
  throw new DraftError(
    "error",
    "The draft could not be saved in this browser. Your unsaved edits are still on this page.",
  );
}
export function createDraftAdapter(
  scope: DraftScope,
  storage: StoragePort | null,
  lock: LockPort | null,
) {
  const key = scopeKey(scope);
  const belongs = (draft: OnboardingDraft) =>
    draft.actorId === scope.actorId &&
    draft.tenantContext === scope.tenantContext;
  function read(): OnboardingDraft[] {
    if (!storage || !lock)
      throw new DraftError(
        "disconnected",
        "Local draft storage is unavailable. Use a supported browser with local storage and Web Locks enabled.",
      );
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch (error) {
      reportError(error);
    }
    if (!raw) return [];
    try {
      if (raw.length > 1_000_000) throw new Error("Oversize");
      const envelope = envelopeSchema.parse(JSON.parse(raw));
      const drafts = envelope.drafts.map(parseDraft);
      if (
        new Set(drafts.map((d) => d.id)).size !== drafts.length ||
        drafts.some((d) => !belongs(d))
      )
        throw new Error("Wrong scope");
      return drafts;
    } catch {
      throw new DraftError(
        "corrupt",
        "Stored drafts could not be verified. They were not overwritten. Use the original browser profile or ask for recovery help.",
      );
    }
  }
  return {
    list: read,
    async save(
      input: OnboardingDraft,
      expectedRevision: number,
    ): Promise<OnboardingDraft> {
      try {
        const draft = parseDraft(input);
        if (!belongs(draft))
          throw new DraftError(
            "permission",
            "This draft belongs to a different account or workspace.",
          );
        if (!storage || !lock)
          throw new DraftError(
            "disconnected",
            "Local draft storage is unavailable. Nothing was saved.",
          );
        return await lock(key, () => {
          const drafts = read();
          const current = drafts.find((d) => d.id === draft.id);
          if (
            (current?.revision ?? 0) !== expectedRevision ||
            draft.revision !== expectedRevision ||
            (!current && expectedRevision !== 0)
          )
            throw new DraftError(
              "conflict",
              "A newer revision exists or this draft changed elsewhere. Your edits are kept here; reload the saved draft before editing again.",
            );
          if (!current && drafts.length >= 10)
            throw new DraftError(
              "capacity",
              "This workspace already has ten local drafts. Continue an existing draft; no business has been activated.",
            );
          const saved: OnboardingDraft = {
            ...draft,
            revision: expectedRevision + 1,
            savedAt: new Date().toISOString(),
          };
          const next = [...drafts.filter((d) => d.id !== saved.id), saved];
          const serialized = JSON.stringify({ version: 1, drafts: next });
          if (serialized.length > 1_000_000)
            throw new DraftError(
              "capacity",
              "These drafts exceed the local storage limit. Shorten the configuration; nothing was overwritten.",
            );
          storage.setItem(key, serialized);
          return saved;
        });
      } catch (error) {
        reportError(error);
      }
    },
  };
}
export type DraftAdapter = ReturnType<typeof createDraftAdapter>;
export function browserDraftAdapter(scope: DraftScope): DraftAdapter {
  try {
    const locks =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    return createDraftAdapter(
      scope,
      window.localStorage,
      locks ? (key, work) => locks.request(key, work) : null,
    );
  } catch (error) {
    reportError(error);
  }
}
