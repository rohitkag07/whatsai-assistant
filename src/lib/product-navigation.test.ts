import { describe, it, expect } from "vitest";
import { productNavigation, destinationActive } from "./product-navigation";
describe("permitted navigation", () => {
  it("does not expose admin routes in client Control or any Command routes to clients", () => {
    expect(productNavigation("command", "client", true)).toEqual([]);
    expect(
      productNavigation("control", "client").every(
        (item) => !item.href.startsWith("/admin"),
      ),
    ).toBe(true);
  });
  it("retains all existing Command routes with at most seven primary destinations", () => {
    const nav = productNavigation("command", "admin");
    expect(nav.filter((item) => !item.secondary)).toHaveLength(7);
    for (const href of [
      "/admin",
      "/admin/command-os",
      "/admin/clients",
      "/admin/conversations",
      "/admin/knowledge",
      "/admin/playbooks",
      "/admin/webhooks",
      "/admin/team",
      "/admin/system",
    ])
      expect(nav.some((item) => item.href === href)).toBe(true);
  });
  it("retains handoffs and restricts lab discovery to its flag", () => {
    expect(
      productNavigation("control", "client").some(
        (item) => item.href === "/bookings",
      ),
    ).toBe(true);
    expect(
      productNavigation("command", "dev").some(
        (item) => item.href === "/admin/design-lab",
      ),
    ).toBe(false);
    expect(
      productNavigation("command", "dev", true).some(
        (item) => item.href === "/admin/design-lab",
      ),
    ).toBe(true);
  });
  it("does not activate overview for every admin route or match prefix collisions", () => {
    expect(destinationActive("/admin/clients", "/admin")).toBe(false);
    expect(destinationActive("/admin/clients/123", "/admin/clients")).toBe(
      true,
    );
    expect(destinationActive("/admin/clientship", "/admin/clients")).toBe(
      false,
    );
  });
});
