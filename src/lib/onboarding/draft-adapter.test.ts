import { describe, it, expect } from "vitest";
import {
  completeSyntheticDraft,
  syntheticScope,
  syntheticId,
} from "../../../tests/fixtures/onboarding";
import {
  createDraftAdapter,
  scopeKey,
  type LockPort,
  type StoragePort,
} from "./draft-adapter";
function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
const lock: LockPort = async (_key, work) => work();
describe("local drafts are scoped proposals, not business authority", () => {
  it("saves incomplete progress, versions edits, and round-trips all six sections of policy", async () => {
    const store = memory();
    const adapter = createDraftAdapter(syntheticScope, store, lock);
    expect(adapter.list()).toEqual([]);
    const draft = completeSyntheticDraft();
    draft.config.identity.name = "";
    const saved = await adapter.save(draft, 0);
    expect(saved.revision).toBe(1);
    expect(saved.savedAt).not.toBeNull();
    expect(draft.revision).toBe(0);
    expect(adapter.list()[0]).toEqual(saved);
    expect((await adapter.save(saved, 1)).revision).toBe(2);
  });
  it("isolates two actors, two tenants and separate configurations", async () => {
    const store = memory();
    const a = createDraftAdapter(syntheticScope, store, lock);
    await a.save(completeSyntheticDraft(), 0);
    const otherActor = { ...syntheticScope, actorId: "another-user" };
    const otherTenant = { ...syntheticScope, tenantContext: "another-tenant" };
    for (const scope of [otherActor, otherTenant]) {
      const adapter = createDraftAdapter(scope, store, lock);
      expect(adapter.list()).toEqual([]);
      await expect(
        adapter.save(completeSyntheticDraft(), 0),
      ).rejects.toMatchObject({ kind: "permission" });
    }
    await a.save(
      completeSyntheticDraft("seller", "22222222-2222-4222-8222-222222222222"),
      0,
    );
    expect(a.list()).toHaveLength(2);
    expect(scopeKey({ actorId: "a:b", tenantContext: "c" })).not.toBe(
      scopeKey({ actorId: "a", tenantContext: "b:c" }),
    );
    expect(scopeKey({ actorId: "a", tenantContext: null })).not.toBe(
      scopeKey({ actorId: "a", tenantContext: "null" }),
    );
  });
  it("rejects stale revisions without overwriting the newer draft", async () => {
    const store = memory();
    const adapter = createDraftAdapter(syntheticScope, store, lock);
    const saved = await adapter.save(completeSyntheticDraft(), 0);
    const updated = await adapter.save(
      {
        ...saved,
        config: {
          ...saved.config,
          identity: { ...saved.config.identity, name: "Synthetic newer" },
        },
      },
      1,
    );
    await expect(adapter.save(saved, 1)).rejects.toMatchObject({
      kind: "conflict",
    });
    expect(adapter.list()[0]).toEqual(updated);
  });
  it("does not overwrite malformed, foreign or unsupported stored envelopes", async () => {
    for (const raw of [
      "not json",
      JSON.stringify({ version: 2, drafts: [] }),
      JSON.stringify({
        version: 1,
        drafts: [{ ...completeSyntheticDraft(), actorId: "foreign" }],
      }),
    ]) {
      const store = memory();
      store.setItem(scopeKey(syntheticScope), raw);
      const adapter = createDraftAdapter(syntheticScope, store, lock);
      expect(() => adapter.list()).toThrow();
      await expect(
        adapter.save(completeSyntheticDraft(), 0),
      ).rejects.toMatchObject({ kind: "corrupt" });
      expect(store.getItem(scopeKey(syntheticScope))).toBe(raw);
    }
  });
  it("reports denied storage, quota and missing lock support without reporting saved", async () => {
    const denied: StoragePort = {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: () => {},
    };
    expect(() =>
      createDraftAdapter(syntheticScope, denied, lock).list(),
    ).toThrow(/denied/);
    const quota: StoragePort = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    await expect(
      createDraftAdapter(syntheticScope, quota, lock).save(
        completeSyntheticDraft(),
        0,
      ),
    ).rejects.toMatchObject({ kind: "error" });
    await expect(
      createDraftAdapter(syntheticScope, memory(), null).save(
        completeSyntheticDraft(),
        0,
      ),
    ).rejects.toMatchObject({ kind: "disconnected" });
  });
  it("supports ten independent business drafts and refuses the eleventh", async () => {
    const adapter = createDraftAdapter(syntheticScope, memory(), lock);
    for (let i = 0; i < 10; i++)
      await adapter.save(
        completeSyntheticDraft(
          "service",
          `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
        ),
        0,
      );
    expect(adapter.list()).toHaveLength(10);
    await expect(
      adapter.save(completeSyntheticDraft("service", syntheticId), 0),
    ).rejects.toMatchObject({ kind: "capacity" });
    expect(adapter.list()).toHaveLength(10);
  });
  it("cannot persist clinic field tampering or an activation status", async () => {
    const store = memory();
    const adapter = createDraftAdapter(syntheticScope, store, lock);
    const clinic = completeSyntheticDraft("clinic");
    clinic.config.qualification.questions.push({
      key: "budget",
      required: true,
    });
    await expect(adapter.save(clinic, 0)).rejects.toThrow();
    await expect(
      adapter.save({ ...completeSyntheticDraft(), status: "Active" } as any, 0),
    ).rejects.toThrow();
    expect(adapter.list()).toEqual([]);
  });
});
