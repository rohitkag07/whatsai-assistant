import { isAdminPlatformRole, type PlatformRole } from "@/lib/auth/roles";
export type ProductContext = "control" | "command";
export type ProductDestination = {
  href: string;
  label: string;
  icon: string;
  secondary?: boolean;
};
const control: ProductDestination[] = [
  { href: "/dashboard", label: "Today", icon: "home" },
  { href: "/chats", label: "Inbox", icon: "inbox" },
  { href: "/leads", label: "Pipeline", icon: "pipeline" },
  { href: "/calendar", label: "Appointments", icon: "calendar" },
  { href: "/knowledge", label: "Knowledge", icon: "knowledge" },
  { href: "/whatsapp-status", label: "Connection", icon: "connection" },
  { href: "/plan-support", label: "Account", icon: "account" },
  {
    href: "/bookings",
    label: "Owner handoffs",
    icon: "handoff",
    secondary: true,
  },
  { href: "/campaigns", label: "Campaigns", icon: "inbox", secondary: true },
  {
    href: "/campaigns/templates",
    label: "Message templates",
    icon: "knowledge",
    secondary: true,
  },
];
const command: ProductDestination[] = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/command-os", label: "Command", icon: "command" },
  { href: "/admin/clients", label: "Businesses", icon: "business" },
  { href: "/admin/conversations", label: "Conversations", icon: "inbox" },
  { href: "/admin/knowledge", label: "Knowledge", icon: "knowledge" },
  { href: "/admin/system", label: "System", icon: "connection" },
  { href: "/admin/team", label: "Access", icon: "access" },
  {
    href: "/admin/playbooks",
    label: "Playbooks",
    icon: "knowledge",
    secondary: true,
  },
  {
    href: "/admin/webhooks",
    label: "Webhooks",
    icon: "connection",
    secondary: true,
  },
];
export function productNavigation(
  context: ProductContext,
  role: PlatformRole,
  designLab = false,
): ProductDestination[] {
  if (context === "command")
    return isAdminPlatformRole(role)
      ? [
          ...command,
          ...(designLab
            ? [
                {
                  href: "/admin/design-lab",
                  label: "Design lab",
                  icon: "lab",
                  secondary: true,
                },
              ]
            : []),
        ]
      : [];
  return [
    ...control,
    ...(isAdminPlatformRole(role)
      ? [
          {
            href: "/assistant-setup",
            label: "Assistant setup",
            icon: "account",
            secondary: true,
          },
          {
            href: "/reports",
            label: "Reports",
            icon: "pipeline",
            secondary: true,
          },
          {
            href: "/settings",
            label: "Settings",
            icon: "account",
            secondary: true,
          },
        ]
      : []),
  ];
}
export function destinationActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}
export function destinationTitle(
  pathname: string,
  destinations: ProductDestination[],
) {
  return (
    [...destinations]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => destinationActive(pathname, item.href))?.label ??
    "Workspace"
  );
}
