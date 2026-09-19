import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="x-page-header">
      <div>
        <p className="x-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="x-description">{description}</p>}
      </div>
      {action && <div className="x-header-action">{action}</div>}
    </div>
  );
}
