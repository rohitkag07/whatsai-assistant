import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw Error("NOT_FOUND");
  },
}));
vi.mock("@/lib/auth/session", () => ({
  requirePlatformRole: async () => ({ platformRole: "admin" }),
  requireBusinessAccess: async () => ({
    platformRole: "client",
    activeBusinessId: "Synthetic-business",
  }),
}));
vi.mock("@/lib/admin-data", () => {
  const fail = vi.fn(() =>
    Promise.reject(Error("Synthetic private exception detail")),
  );
  return {
    loadAdminBusinesses: fail,
    loadAdminTeam: fail,
    loadAdminKnowledge: fail,
    loadAdminPlaybooks: fail,
    loadAdminMessages: fail,
    loadAdminClientDetail: fail,
    loadAdminOverview: fail,
    loadAdminWebhookEvents: fail,
  };
});
import { FirstRunJourney } from "@/components/first-run/FirstRunJourney";
import { syntheticReadiness } from "@/lib/first-run/fixtures";
import { ClientOneEvidenceView } from "@/components/evidence/client-one-evidence-view";
import { emptyMetrics } from "@/lib/evidence-calculator";
import { TemplateManager } from "@/components/whatsai/TemplateManager";
import { BroadcastCampaigns } from "@/components/whatsai/BroadcastCampaigns";
import { KnowledgeWorkspace } from "@/components/whatsai/KnowledgeWorkspace";
vi.mock("@/components/admin/CommandExperiencePage", () => ({
  commandExperience: () => null,
}));
import { loadAdminOverview } from "@/lib/admin-data";
vi.mock("@/components/control/ControlEntry", () => ({
  controlEntry: () => null,
}));
vi.mock("@/components/first-run/FirstRunEntry", () => ({
  firstRunEntry: () => null,
}));
vi.mock("@/lib/whatsai-data", () => ({
  loadWhatsAiInboxData: async () => ({ source: "error" }),
  loadOperatorLeadsData: async () => ({ source: "error" }),
}));
vi.mock("@/lib/calendar-data", () => ({
  loadCalendarData: async () => ({ source: "error" }),
}));
import Today from "@/app/(dashboard)/dashboard/page";
import Pipeline from "@/app/(dashboard)/leads/page";
import Calendar from "@/app/(dashboard)/calendar/page";
import Overview from "@/app/admin/page";
import Clients from "@/app/admin/clients/page";
import Webhooks from "@/app/admin/webhooks/page";
import Team from "@/app/admin/team/page";
import Knowledge from "@/app/admin/knowledge/page";
import Playbooks from "@/app/admin/playbooks/page";
import Conversations from "@/app/admin/conversations/page";
import Client from "@/app/admin/clients/[id]/page";
const scope = {
  actorId: "Synthetic-owner",
  tenantContext: "Synthetic-business",
};
describe("Phase 6 recovery, layout stability and evidence honesty", () => {
  it("server snapshot keeps checklist geometry while local actions remain blocked before hydration", () => {
    const html = renderToStaticMarkup(
      <FirstRunJourney
        scope={scope}
        snapshot={syntheticReadiness(scope)}
        canEdit
      />,
    );
    expect(html).toContain("Your readiness checklist");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("Synthetic fixture evidence only");
  });
  it("read-only presentation cannot offer owner configuration", () => {
    const html = renderToStaticMarkup(
      <FirstRunJourney
        scope={scope}
        snapshot={syntheticReadiness(scope)}
        canEdit={false}
      />,
    );
    expect(html).toContain("Only an active business owner can edit");
    expect(html).not.toContain("Edit configuration");
  });
  it.each([
    ["overview flag-off", Overview],
    ["clients flag-off", Clients],
    ["webhooks flag-off", Webhooks],
    ["team", Team],
    ["knowledge", Knowledge],
    ["playbooks", Playbooks],
    ["conversations", Conversations],
  ] as const)(
    "recovers %s read failures without an empty-queue claim or private exception",
    async (_, Page) => {
      const html = renderToStaticMarkup(await Page());
      expect(html).toContain('data-state="error"');
      expect(html).not.toContain("Synthetic private exception detail");
      expect(html).not.toContain("No team members found");
      expect(html).not.toContain("No playbooks configured");
    },
  );
  it("client detail offers recovery instead of a crash or inferred missing client", async () => {
    const html = renderToStaticMarkup(
      await Client({ params: Promise.resolve({ id: "Synthetic-business" }) }),
    );
    expect(html).toContain("Client details unavailable");
    expect(html).toContain("Back to clients");
    expect(html).not.toContain("Synthetic private exception detail");
  });
  it("unavailable evidence never claims measured zero samples or verified RLS", () => {
    const html = renderToStaticMarkup(
      <ClientOneEvidenceView
        evidence={{
          status: "unavailable",
          generatedAt: "2026-10-03T00:00:00Z",
          period: {
            currentStart: "2026-09-03T00:00:00Z",
            previousStart: "2026-08-04T00:00:00Z",
            currentEnd: "2026-10-03T00:00:00Z",
          },
          metrics: emptyMetrics(),
          targets: { processingLatencyMs: 3000, deliveryRatePercent: 99 },
          messageSource: "none",
          errors: ["Synthetic missing source"],
        }}
      />,
    );
    expect(html).toContain("Sample count unavailable");
    expect(html).toContain("Unknown");
    expect(html).toContain("does not verify those policies");
    expect(html).not.toContain("0 measured samples");
    expect(html).not.toContain("operating proof for");
  });
});

describe("Legacy catalogue loading semantics", () => {
  it.each([TemplateManager, BroadcastCampaigns, KnowledgeWorkspace])(
    "does not show an empty result or editable catalogue before the first read",
    (Component) => {
      const html = renderToStaticMarkup(<Component />);
      expect(html).toContain('data-state="loading"');
      expect(html).toContain('aria-busy="true"');
      expect(html).not.toContain("No templates synced yet");
      expect(html).not.toContain("Publish Replies");
      expect(html).not.toContain("Your first campaign starts");
    },
  );
});

describe("Legacy count evidence boundaries", () => {
  it("does not present ambiguous error-or-zero legacy counts as measured zero", async () => {
    vi.mocked(loadAdminOverview).mockResolvedValueOnce({
      businesses: [],
      activity: [],
      stats: {
        totalClients: 0,
        liveConnections: 0,
        messagesSentToday: 0,
        hotHandoffs: 0,
      },
    });
    const html = renderToStaticMarkup(await Overview());
    expect(html).toContain("Unknown");
    expect(html).toContain("No verified count available");
    expect(html).not.toContain("Connected channels accepting messages");
  });
});

describe("Flag-off Control read failures", () => {
  it.each([Today, Pipeline, Calendar])(
    "shows recovery without assumed connection, empty queues or ready-to-send actions",
    async (Page) => {
      const html = renderToStaticMarkup(await Page());
      expect(html).toContain('data-state="error"');
      expect(html).not.toContain("WhatsApp connected");
      expect(html).not.toContain("Send a Test Message");
      expect(html).not.toContain("No handoffs waiting");
      expect(html).not.toContain("Schedule site visit");
    },
  );
});
