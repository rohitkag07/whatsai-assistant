import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
import { DashboardShell } from "@/components/shared/DashboardShell";
import { DesignLab } from "@/components/system/DesignLab";
import { SystemState } from "@/components/system/SystemState";
const props = {
  navMode: "client" as const,
  platformRole: "client" as const,
  activeBusinessId: "a",
  businesses: [],
  foundationState: {
    businesses: { status: "disconnected" as const, data: null },
    unread: { status: "unknown" as const, data: null },
  },
};
describe("foundation rendering and rollback", () => {
  it("renders unavailable data as unknown with no invented success", () => {
    const html = renderToStaticMarkup(
      <DashboardShell {...props} foundation>
        <h1>Content</h1>
      </DashboardShell>,
    );
    expect(html).toContain("Unread conversations unknown");
    expect(html).toContain("Workspace data is not connected");
    expect(html).not.toContain("0 unread conversations");
    expect(html).not.toContain('href="/admin"');
  });
  it("returns the preserved shell with the feature flag off", () => {
    const html = renderToStaticMarkup(
      <DashboardShell {...props} foundation={false}>
        <h1>Content</h1>
      </DashboardShell>,
    );
    expect(html).toContain("Customer Chats");
    expect(html).toContain("Reception desk");
    expect(html).not.toContain('data-shell="foundation"');
    expect(html).not.toContain("x-top-rail");
  });
  it("labels preview content and does not imply real appointment or outcome evidence", () => {
    const html = renderToStaticMarkup(<DesignLab />);
    expect(html).toContain("Synthetic");
    expect(html).toContain(
      "No customer data, live metrics or external actions",
    );
    expect(html).toContain("Outcome unknown");
    expect(html).toContain("not a confirmed appointment");
  });
  it.each([
    "loading",
    "empty",
    "error",
    "disconnected",
    "permission",
    "unknown",
    "partial",
  ] as const)("renders an accessible %s state", (kind) => {
    const html = renderToStaticMarkup(<SystemState kind={kind} />);
    expect(html).toContain(`data-state="${kind}"`);
    expect(html).toContain("aria-label=");
    expect(html).not.toContain("undefined");
  });
});
