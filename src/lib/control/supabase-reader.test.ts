import { describe, it, expect, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { supabaseReadPort } from "./supabase-reader";
describe("Supabase SELECT gateway transport", () => {
  it("issues only GET with tenant, parent, cursor, ordering and count predicates", async () => {
    const requests: { url: URL; method: string; prefer: string }[] = [];
    const client = createClient<Database>(
      "https://nonproduction.invalid",
      "synthetic-public-test-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: async (input, init) => {
            requests.push({
              url: new URL(String(input)),
              method: init?.method ?? "GET",
              prefer: new Headers(init?.headers).get("prefer") ?? "",
            });
            return new Response("[]", {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Content-Range": "*/0",
              },
            });
          },
        },
      },
    );
    const port = supabaseReadPort(client);
    await port({
      table: "conversation_messages",
      businessId: "a",
      threadIds: ["t1", "t2"],
      after: "m0",
      limit: 50,
    });
    await port({
      table: "business_members",
      businessId: "a",
      actorId: "actor",
      limit: 50,
    });
    await port({
      table: "lead_qualification_answers",
      businessId: "a",
      threadIds: ["t1"],
      limit: 50,
    });
    expect(
      requests.every(
        (r) => r.method === "GET" && r.prefer.includes("count=exact"),
      ),
    ).toBe(true);
    expect(requests[0].url.searchParams.get("business_id")).toBe("eq.a");
    expect(requests[0].url.searchParams.get("thread_id")).toBe("in.(t1,t2)");
    expect(requests[0].url.searchParams.get("id")).toBe("gt.m0");
    expect(requests[0].url.searchParams.get("order")).toBe("id.asc");
    expect(requests[1].url.searchParams.get("user_id")).toBe("eq.actor");
    expect(requests[1].url.searchParams.get("active")).toBe("eq.true");
    expect(requests[2].url.searchParams.get("thread_id")).toBe("in.(t1)");
    await expect(
      port({ table: "lead_qualification_answers", businessId: "a", limit: 50 }),
    ).rejects.toThrow("Parent scope required");
    expect(requests).toHaveLength(3);
  });
});
